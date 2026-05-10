import * as c from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { powerUp, sadMusic } from './audioFiles.js'

export class Goomba {
    constructor(scene) {
        this.scene = scene
        this.object = new c.Object3D()
        this.mixer = null
        this.isLoaded = false
        this.move = {
            forward: false,
            back: false,
            right: false,
            left: false,
        }
        this.file = './assets/models/goomba.glb'
        this.animations = {
            sad: null,
            glare: null,
            idle: null,
            walk: null,
            dance: null,
        }
        this.model = null
        this.walkSpeed = 0.07
        this.turnSpeed = 0.03
        this.gltfLoader = new GLTFLoader()
        this.isMoving = false
        this.eyes = null
        this.grow = false
        this.shrink = false
        this.isSad = false
        this.isAngry = false
        this.isDancing = false
        this.currentAnimation = null
        this.activeAction = null
        this.morph = null
        this.growID = null
        this.load()
        this.scene.add(this.object)
    }

    growGoomby() {
        let maxSize = 3.5
        if (this.object.scale.x <= maxSize) {
            this.growID = requestAnimationFrame(() => this.growGoomby())
            this.isSad = false
            powerUp.play()
            const mat = new c.MeshToonMaterial({ color: 'red' })
            this.eyes.material = mat
            this.grow = true
            const topIndex = this.morph.morphTargetDictionary.eyelidstop
            const botIndex = this.morph.morphTargetDictionary.eyelidsbottom
            this.morph.morphTargetInfluences[topIndex] = 0.77
            this.morph.morphTargetInfluences[botIndex] = 0.66
            this.object.scale.x += 0.03
            this.object.scale.y += 0.03
            this.object.scale.z += 0.03
            setTimeout(() => {
                cancelAnimationFrame(this.growID)
                this.grow = false
            }, 1400)
        }
    }

    shrinkGoomby() {
        let minSize = 1.1
        if (this.isSad) {
            this.isSad = false
            sadMusic.pause()
            const lipIndex = this.morph.morphTargetDictionary.sadlip
            const topIndex = this.morph.morphTargetDictionary.eyelidstop
            const botIndex = this.morph.morphTargetDictionary.eyelidsbottom
            this.morph.morphTargetInfluences[topIndex] = 0
            this.morph.morphTargetInfluences[botIndex] = 0
            this.morph.morphTargetInfluences[lipIndex] = 0
            const mat = new c.MeshToonMaterial({ color: 'black' })
            this.eyes.material = mat
        }

        if (this.object.scale.x >= minSize) {
            const frame2 = requestAnimationFrame(() => this.shrinkGoomby())
            this.object.scale.x -= 0.03
            this.object.scale.y -= 0.03
            this.object.scale.z -= 0.03
            const lipIndex = this.morph.morphTargetDictionary.sadlip
            const topIndex = this.morph.morphTargetDictionary.eyelidstop
            const botIndex = this.morph.morphTargetDictionary.eyelidsbottom
            this.morph.morphTargetInfluences[topIndex] = 0
            this.morph.morphTargetInfluences[botIndex] = 0
            this.morph.morphTargetInfluences[lipIndex] = 0
            const mat = new c.MeshToonMaterial({ color: 'black' })
            this.eyes.material = mat
        }
    }

    sadGoomby() {
        const mat = new c.MeshToonMaterial({ color: 'blue' })
        this.eyes.material = mat
        this.isSad = true
        sadMusic.currentTime = 0
        sadMusic.play()
    }

    playAnimation(name) {
        if (this.currentAnimation === name) return

        this.currentAnimation = name

        if (this.activeAction) {
            this.activeAction.fadeOut(0.2)
        }

        const anim = this.mixer.clipAction(this.animations[name])

        if (name === 'sad' || name === 'glare') {
            anim.setLoop(c.LoopOnce)
            anim.clampWhenFinished = true
        }

        anim.reset().fadeIn(0.2).play()
        this.activeAction = anim
    }

    update() {
        if (this.isMoving) {
            this.playAnimation('walk')
            this.object.translateZ(-0.005)
        } else if (this.isDancing)  {
            this.playAnimation('dance')
        } else if (this.sad) {
            this.playAnimation('sad')
        } else if (this.grow) {
            this.playAnimation('glare')
        } else {
            this.playAnimation('idle')
        }

        const lipIndex = this.morph.morphTargetDictionary.sadlip
        if (this.isSad) {
            this.morph.morphTargetInfluences[lipIndex] = 1
        } 
        //else {
       //     this.morph.morphTargetInfluences[lipIndex] = 1
       // }
        
    }

    load() {
        this.gltfLoader.load(
            this.file,
            (glb) => {
                this.model = glb.scene
                this.object.add(this.model)

                this.mixer = new c.AnimationMixer(this.model)

                this.model.scale.set(0.8, 0.8, 0.8)

                this.model.updateMatrixWorld()
                this.model.rotation.y = Math.PI / 1

                this.object.position.set(0, 0, -5)

                this.model.traverse((child) => {
                    if (child.name === 'goomba_1') {
                        this.morph = child
                    }
                })

                glb.animations.forEach(child => {
                    if (child.name === 'SGlare') {
                        this.animations.glare = child
                    }

                    if (child.name === 'SSad') {
                        this.animations.sad = child
                    }

                    if (child.name === 'AIdle') {
                        this.animations.idle = child
                    }

                    if (child.name === 'AWalk') {
                        this.animations.walk = child
                    }

                    if (child.name === 'A_Dance') {
                        this.animations.dance = child
                    }
                })

                this.playAnimation('idle')
                
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.material.roughness = 0.6
                        child.castShadow = true
                        
                        if (child.name === 'goomba_2') {
                            this.eyes = child
                        }
                    }
                })

                
            }
        )
    }
}