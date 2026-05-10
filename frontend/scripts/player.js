import * as c from 'three'
import * as j from './audioFiles.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DustParticle } from './particles/dust.js'

export class Player {
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
            jump: false,
            dance: false
        }
        this.canJump = true
        this.file = './assets/models/mario.glb'
        this.animations = {
            idle: null,
            run: null,
            jump: null,
            land: null,
            swimidle: null,
            swimming: null,
            enterPipe: null
        }
        this.model = null
        this.morph = null
        this.onGround = false
        this.walkSpeed = 0.07
        this.turnSpeed = 0.03
        this.coinCount = 0
        this.starCount = 0
        this.gltfLoader = new GLTFLoader()
        this.isMoving = null
        this.currentAnimation = null
        this.activeAnimation = null
        this.isJumping = false
        this.isDancing = false
        this.isSwimIdle = false
        this.isSwimming = false
        this.notDead = true
        this.reset = false
        this.yvel = 0
        this.alive = true
        this.isFalling = false
        this.onPipe = false
        this.onPipe2 = false
        this.enterPipe = false
        this.goingDown = true
        this.inConvo = false
        this.onPlatform = null
        this.dust = new DustParticle(this.scene)
        this.load()
        this.scene.add(this.object)
    }

    downPipe(pos) {
        this.enterPipe = true
        j.tunnelSound.play()

        setTimeout(() => {
            this.object.position.x = pos.x
            this.object.position.y = pos.y + 1.5
            this.object.position.z = pos.z
            this.enterPipe = false
            this.onPipe = false
        }, 1300)
    }

    dance() {
        this.isDancing = !this.isDancing
        if (this.isDancing) {
            this.model.rotation.y = Math.PI / 1
        } else {
            this.model.rotation.y = 0
        }
    }

    dustUpdate() {
        this.dust.update()
    }

    killMario() {
        if (this.notDead && !this.reset) {

            this.notDead = false
            const index = this.morph.morphTargetDictionary.dead
            this.morph.morphTargetInfluences[index] = 1
            this.model.rotation.y = Math.PI / 1
            j.deathAudio.play()
            this.alive = false
                            
            setTimeout(() => {
                this.alive = true
                this.yvel = 0
            }, 1000)
        }
    
        if (!this.reset) {
            this.reset = true
            setTimeout(() => {
                const index = this.morph.morphTargetDictionary.dead
                this.model.rotation.y = 0
                this.morph.morphTargetInfluences[index] = 0
            }, 2200)
    
            setTimeout(() => {
                this.reset = false
                this.notDead = true
            }, 3000)
        }
       
    }

    playAnimation(name) {
        if (this.currentAnimation === name) return;

        this.currentAnimation = name

        if (this.activeAnimation) {
            this.activeAnimation.fadeOut(0.2)
        }

        const anim = this.mixer.clipAction(this.animations[name])

        if (name === 'jump' || name === 'enterPipe') {
            anim.setLoop(c.LoopOnce)
            anim.clampWhenFinished = true
        }
        
        anim.reset().fadeIn(0.2).play()
        this.activeAnimation = anim
    }

    playerMovement() {
        this.isMoving = this.move.forward || this.move.back || this.move.right || this.move.left

        if (this.isJumping) {
            this.playAnimation('jump')
        } else if (this.isSwimIdle)  {
            this.playAnimation('swimidle')
        } else if (this.isMoving)  {
            this.dust.emit(this.object.position, 0.5)
            this.playAnimation('run')
        } else if (this.enterPipe)  {
            this.playAnimation('enterPipe')
        } else if (this.isDancing)  {
            this.playAnimation('dance')
        } else {
            this.playAnimation('idle')
        }

        if (this.move.forward) {
            j.grassAudio.play()
            this.object.translateZ(this.walkSpeed)
        }

        if (this.move.back) {
            j.grassAudio.play()
            this.object.translateZ(-this.walkSpeed)
        }

        if (this.move.left) {
            this.object.rotation.y += this.turnSpeed
        }

        if (this.move.right) {
            this.object.rotation.y -= this.turnSpeed
        }
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

                glb.animations.forEach((child) => {
                    if (child.name === '1Idledefault') {
                        this.animations.idle = child
                    }

                    if (child.name === '2Run') {
                        this.animations.run = child
                    }

                    if (child.name === '3Jump') {
                        this.animations.jump = child
                    }

                    if (child.name === '4dance') {
                        this.animations.dance = child
                    }

                    if (child.name === '5Swimidle') {
                        this.animations.swimidle = child
                    }

                    if (child.name.includes('6')) {
                        this.animations.enterPipe = child
                    }

                })
                    
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.material.roughness = 0.7
                        child.castShadow = true
                        child.receiveShadow = true
                        this.morph = child
                    }
                })
            }
        )
    }
}