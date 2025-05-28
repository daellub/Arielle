// app/vrm/components/VRMViewerModel.tsx
'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin, VRM, VRMHumanBoneName } from '@pixiv/three-vrm'
import { useVRMStore } from '@/app/vrm/store/vrmStore'

function applyIdlePose(vrm: VRM) {
    const bones = vrm.humanoid?.humanBones
    if (!bones) return

    const setRotation = (boneName: VRMHumanBoneName, x = 0, y = 0, z = 0) => {
        const bone = bones[boneName]?.node
        if (bone) {
            const euler = new THREE.Euler(x, y, z)
            bone.quaternion.setFromEuler(euler)
            console.log(`[IdlePose] ${boneName} rotation applied`)
        } else {
            console.warn(`[IdlePose] ${boneName} not found`)
        }
    }

    setRotation(VRMHumanBoneName.LeftUpperArm, -0.7, 0, 0.6)
    setRotation(VRMHumanBoneName.RightUpperArm, -0.7, 0, -0.6)
    setRotation(VRMHumanBoneName.LeftLowerArm, -0.3, 0.1, 0)
    setRotation(VRMHumanBoneName.RightLowerArm, -0.3, -0.1, 0)
}

export default function VRMViewerModel() {
    const containerRef = useRef<HTMLDivElement>(null)
    const vrmRef = useRef<VRM | null>(null)
    
    const emotion = useVRMStore((s) => s.selectedEmotion)
    const strength = useVRMStore((s) => s.emotionStrength)

    useEffect(() => {
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20)
        camera.position.set(0, 1.4, 2)
        camera.lookAt(0, 1.2, 0)

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        renderer.setPixelRatio(window.devicePixelRatio)

        const container = containerRef.current
        if (!container) return

        Array.from(container.children).forEach((child) => {
            if (child.tagName.toLowerCase() === 'canvas') {
                container.removeChild(child)
            }
        })

        const width = container.clientWidth
        const height = container.clientHeight
        renderer.setSize(width, height)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        container.appendChild(renderer.domElement)

        const light = new THREE.DirectionalLight(0xffffff, 1.2)
        light.position.set(0, 1.4, 2)
        scene.add(light)

        const ambient = new THREE.AmbientLight(0xffffff, 0.4)
        scene.add(ambient)

        const loader = new GLTFLoader()
        loader.register((parser) => new VRMLoaderPlugin(parser))

        const clock = new THREE.Clock()

        let isLoaded = false
        let hasAppliedIdlePose = false

        loader.load('/models/Arielle.vrm', (gltf) => {
            const vrm = gltf.userData.vrm as VRM
            vrm.scene.position.set(0, 0.25, 0)
            vrm.scene.scale.set(1, 1, 1)
            vrm.scene.rotation.set(0, Math.PI, 0)

            scene.add(vrm.scene)
            vrmRef.current = vrm
            isLoaded = true
        })

        let frameId: number

        const animate = () => {
            frameId = requestAnimationFrame(animate)
            const delta = clock.getDelta()

            if (isLoaded && vrmRef.current) {
                if (!hasAppliedIdlePose) {
                    applyIdlePose(vrmRef.current)
                    hasAppliedIdlePose = true
                }

                // vrmRef.current.update(delta) ← 이거 주석처리
                renderer.render(scene, camera)
            }
        }

        animate()

        return () => {
            cancelAnimationFrame(frameId)
            renderer.dispose()
            scene.clear()
        }
    }, [])

    useEffect(() => {
        const vrm = vrmRef.current
        if (!vrm || !vrm.expressionManager) return

        const expression = vrm.expressionManager.getExpression(emotion)
        if (expression) {
            expression.weight = strength / 100
        }
    }, [emotion, strength])

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                zIndex: 20,
            }}
        />
    )
}