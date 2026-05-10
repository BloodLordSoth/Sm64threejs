import * as c from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export class Star {
    constructor(scene) {
        this.scene = scene
        this.object = new c.Object3D()
        this.model = null
        this.gltfloader = new GLTFLoader()
        this.file = './assets/models/star.glb'
        this.load()
        this.scene.add(this.object)
    }

    load() {
        this.gltfloader.load(
            this.file,
            (glb) => {
                this.model = glb.scene
                this.object.add(this.model)
            }
        )
    }
}