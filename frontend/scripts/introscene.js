import * as c from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export class Intro {
    constructor() {
        this.scene = new c.Scene()
        this.textureloader = new c.TextureLoader()
        this.map = this.textureloader.load('./assets/images/marioselectbg.png')
        this.gltfloader = new GLTFLoader()
        this.object = new c.Object3D()
        this.object.visible = false
        this.model = null
        this.head = './assets/models/mariohead.glb'
        this.growID = null
        this.isTalking = false
        this.talk = null
        this.mixer = null
        this.ready = this.load()
        this.scene.add(this.object)
    }

    startScene() {
        this.growID = requestAnimationFrame(() => this.startScene())
        this.object.visible = true
        let val = 5
        if (this.object.scale.x <= val) {
            this.object.scale.x += 0.08
            this.object.scale.y += 0.08
            this.object.scale.z += 0.08
        }
        setTimeout(() => {
            this.isTalking = true
        }, 800)
        setTimeout(() => {
            this.isTalking = false
            cancelAnimationFrame(this.growID)
        }, 4400)
    }

    load() {
        return new Promise(res => {
            this.gltfloader.load(
                this.head,
                (glb) => {
                    this.model = glb.scene

                    this.object.position.set(1, -1, 0)

                    this.model.rotation.y = Math.PI / 1

                    this.mixer = new c.AnimationMixer(this.model)

                    glb.animations.forEach(child => {                    
                        if (child.name === 'KeyAction') {
                            this.talk = child
                        }
                    })

                    const talk = this.mixer.clipAction(this.talk)
                    talk.play()

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