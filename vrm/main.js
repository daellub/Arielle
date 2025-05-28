import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 1.4, 9)

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
})
renderer.setClearColor(0x000000, 0)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const light = new THREE.DirectionalLight(0xffffff)
light.position.set(1, 1, 1).normalize()
scene.add(light)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(-3.3, 2.35, 0)
controls.update()

const loader = new GLTFLoader()
loader.register((parser) => new VRMLoaderPlugin(parser))

let vrmModel = null

loader.load('./Arielle.vrm', (gltf) => {
    const vrm = gltf.userData.vrm

    vrm.scene.rotation.set(0, Math.PI, 0)
    scene.add(vrm.scene)
    vrmModel = vrm
    console.log('✅ VRM 로드 완료', vrm)
})

const toggleBtn = document.getElementById('toggle-pos')
const posControls = document.getElementById('pos-controls')
const toggleExpr = document.getElementById('toggle-expression')
const exprControls = document.getElementById('expression-controls')

toggleBtn.addEventListener('click', () => {
    posControls.classList.toggle('open')
})

document.getElementById('posX').addEventListener('input', (e) => {
    if (vrmModel) vrmModel.scene.position.x = parseFloat(e.target.value)
})
document.getElementById('posY').addEventListener('input', (e) => {
    if (vrmModel) vrmModel.scene.position.y = parseFloat(e.target.value)
})
document.getElementById('posZ').addEventListener('input', (e) => {
    if (vrmModel) vrmModel.scene.position.z = parseFloat(e.target.value)
})

document.getElementById('scale').addEventListener('input', (e) => {
    if (vrmModel) vrmModel.scene.scale.setScalar(parseFloat(e.target.value))
})

document.getElementById('opacity').addEventListener('input', (e) => {
    if (!vrmModel) return
    const opacity = parseFloat(e.target.value)

    vrmModel.scene.traverse((obj) => {
        if (obj.isMesh) {
            let mats = Array.isArray(obj.material) ? obj.material : [obj.material]

            mats = mats.filter((mat) => mat && !isDefinitelyOutline(mat))

            mats = mats.map((mat) => {
                const newMat = mat.clone()
                newMat.transparent = true
                newMat.opacity = opacity
                newMat.depthWrite = opacity === 1
                newMat.alphaTest = 0.0
                newMat.side = THREE.DoubleSide
                newMat.needsUpdate = true
                return newMat
            })

            obj.material = mats.length === 1 ? mats[0] : mats
        }
    })
})

toggleExpr.addEventListener('click', () => {
    exprControls.classList.toggle('open')
})

function setBlendShape(name, weight) {
    if (!vrmModel) return

    vrmModel.scene.traverse((obj) => {
        if (obj.isMesh && obj.morphTargetDictionary && obj.morphTargetInfluences) {
            console.log(`🎯 ${obj.name}:`, Object.keys(obj.morphTargetDictionary))
            
            const index = obj.morphTargetDictionary[name]
            if (index !== undefined) {
                obj.morphTargetInfluences[index] = weight
            }
        }
    })
}

// document.getElementById('bs-smile').addEventListener('input', (e) => {
//     setBlendShape('mouth_smile', parseFloat(e.target.value))
// })
// document.getElementById('bs-blink').addEventListener('input', (e) => {
//     setBlendShape('vrc_blink', parseFloat(e.target.value))
// })
// document.getElementById('bs-surprised').addEventListener('input', (e) => {
//     setBlendShape('eye_surprised', parseFloat(e.target.value))
// })
// document.getElementById('bs-angry').addEventListener('input', (e) => {
//     setBlendShape('eyebrows_angry_1', parseFloat(e.target.value))
// })

// Render loop
const clock = new THREE.Clock()
const animate = () => {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}
animate()
