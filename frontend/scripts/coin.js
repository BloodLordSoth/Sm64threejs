import * as c from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export class Coin {
    constructor(scene) {
        this.scene = scene
        this.object = new c.Object3D()
        this.model = null
        this.gltfloader = new GLTFLoader()
        this.file = './assets/models/redcoin.glb'
        this.load()
        this.scene.add(this.object)
    }

    update() {
        this.object.rotation.y += 0.04
    }

    load() {
        this.gltfloader.load(
            this.file,
            (glb) => {
                this.model = glb.scene
                this.object.add(this.model)

                this.model.updateMatrixWorld()

                this.model.scale.set(0.55, 0.55, 0.55)
            }
        )
    }
}