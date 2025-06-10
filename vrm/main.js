import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import {
    VRMAnimationLoaderPlugin,
    createVRMAnimationClip,
} from '@pixiv/three-vrm-animation'
const { ipcRenderer } = require('electron')

import { applyExpression } from './scripts/applyExpression.js'

// === SCENE SETUP ===
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 2.0, 9)

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 2
renderer.setClearColor(0x000000, 0)
document.body.appendChild(renderer.domElement)

// === LIGHTING ===
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2))
scene.add(new THREE.AmbientLight(0xffffff, 0.4))

const frontLight = new THREE.DirectionalLight(0xffffff, 2.5)
frontLight.position.set(0, 2, 5)
scene.add(frontLight)

const backLight = new THREE.DirectionalLight(0xccccff, 1.5)
backLight.position.set(0, 2, -5)
scene.add(backLight)

const warmLight = new THREE.DirectionalLight(0xfff0e0, 1.5)
warmLight.position.set(0, 2, 4)
scene.add(warmLight)

// === CAMERA CONTROLS ===
const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(-3.3, 2.55, 0)
controls.update()

// === GLTF + VRM + VRMA LOADER SETUP ===
const loader = new GLTFLoader()
loader.register(parser => new VRMLoaderPlugin(parser, { autoUpdateHumanBones: false }))
loader.register(parser => new VRMAnimationLoaderPlugin(parser))

const vrmUrl = new URL('/models/Arielle.vrm', import.meta.url).href
const vrmaUrl1 = new URL('/animations/VRMA_02.vrma', import.meta.url).href
const vrmaUrl2 = new URL('/animations/Idle.vrma', import.meta.url).href

let vrmModel = null
let mixer = null

// ✅ 고정 위치용 그룹
const modelGroup = new THREE.Group()
modelGroup.position.set(0, 0.25, 0)
modelGroup.scale.set(2, 2, 2)
scene.add(modelGroup)

// === LOAD VRM + VRMA
Promise.all([
    loader.loadAsync(vrmUrl),
    loader.loadAsync(vrmaUrl1),
    loader.loadAsync(vrmaUrl2),
]).then(([vrmGltf, vrmaGltf1, vrmaGltf2]) => {
    vrmModel = vrmGltf.userData.vrm
    vrmModel.scene.rotation.y = Math.PI
    vrmModel.humanoid.autoUpdateHumanBones = true
    modelGroup.add(vrmModel.scene)

    vrmModel.scene.traverse((obj) => {
        if (obj.isSkinnedMesh && obj.morphTargetDictionary) {
            console.log('🧩 SkinnedMesh:', obj.name)
            console.log('🔤 blendShape keys:', Object.keys(obj.morphTargetDictionary))
        }
    })

    const anim1 = vrmaGltf1.userData.vrmAnimations?.[0]
    const anim2 = vrmaGltf2.userData.vrmAnimations?.[0]

    if (anim1 && anim2) {
        const clip1 = createVRMAnimationClip(anim1, vrmModel)
        const clip2 = createVRMAnimationClip(anim2, vrmModel)
        console.log('[DEBUG] track names:', clip2.tracks.map(t => t.name))

        clip2.tracks = clip2.tracks.filter(track => track.name !== 'Normalized_Hips.position')

        mixer = new THREE.AnimationMixer(vrmModel.scene)

        const action1 = mixer.clipAction(clip1)
        action1.setLoop(THREE.LoopOnce, 0)
        action1.clampWhenFinished = true
        action1.enabled = true

        const action2 = mixer.clipAction(clip2)
        action2.setLoop(THREE.LoopRepeat)
        action2.reset()

        mixer.addEventListener('finished', (e) => {
            if (e.action === action1) {
                console.log('🎬 action1 끝 → Idle 시작')
                action2.reset()
                action2.crossFadeFrom(action1, 0.5, false)
                action2.play()
            }
        })

        action1.play()
    }
})

// === DEV TOGGLE ===
document.addEventListener('keydown', async (e) => {
    if (e.key === 'F1') {
        const res = await fetch('/expressions/idle.json')
        const preset = await res.json()
        applyExpression(vrmModel, preset)
    }
    if (e.key === 'F2') {
        const res = await fetch('/expressions/shy.json')
        const preset = await res.json()
        applyExpression(vrmModel, preset)
    }
    if (e.key === 'F3') {
        const res = await fetch('/expressions/cry.json')
        const preset = await res.json()
        applyExpression(vrmModel, preset)
    }
    if (e.key === 'F4') {
        const res = await fetch('/expressions/vamp.json')
        const preset = await res.json()
        applyExpression(vrmModel, preset)
    }
})

ipcRenderer.on('dev-panel-visibility', (_, visible) => {
    const panel = document.getElementById('dev-panel')
    if (panel) panel.style.display = visible ? 'block' : 'none'
})

// === ANIMATION LOOP ===
const clock = new THREE.Clock()
function animate() {
    requestAnimationFrame(animate)
    const delta = clock.getDelta()
    if (mixer) mixer.update(delta)
    if (vrmModel) vrmModel.update(delta)
    renderer.render(scene, camera)
}
animate()
