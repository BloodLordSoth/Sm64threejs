import * as c from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export class EndScene {
    constructor(gameWidth, gameHeight) {
        this.scene = new c.Scene()
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight
        this.textureloader = new c.TextureLoader()
        this.map = this.textureloader.load('./assets/images/gameoverbg.jpg')
        this.camera = new c.PerspectiveCamera(75, this.gameWidth / this.gameHeight, 0.1, 1000)
        this.camera.position.set(0, 2, 4)
        this.camera.lookAt(0, 0, 0)
        this.gltfloader = new GLTFLoader()
        this.object = new c.Object3D()
        this.model = null
        this.file = './assets/models/mariohead.glb'
        this.mixer = null
        this.talk = null
        this.morph = null
        this.ready = this.load()
        this.scene.add(this.object)
    }

    load() {
        return new Promise(res => {
            this.gltfloader.load(
                this.file,
                    (glb) => {
                    this.model = glb.scene
                
                    this.mixer = new c.AnimationMixer(this.model)

                    this.model.scale.set(3, 3, 3)
                    this.model.rotation.x -= 0.2

                    const talkAnim = glb.animations[0]
                    this.talk = this.mixer.clipAction(talkAnim)

                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            const ind = child.morphTargetDictionary.deadeyes
                            child.morphTargetInfluences[ind] = 1
                        }
                    })
                    this.object.add(this.model)
                    res()
                }
            )

            this.scene.background = this.map
            const hemiLight = new c.HemisphereLight(0xFFE5B4, 'white', 1)
            this.scene.add(hemiLight)
        })
    }
}