import * as c from 'three'
import * as s from './audioFiles.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Water } from 'three/addons/objects/Water.js'
import { Player } from './player.js'
import { Goomba } from './goomba.js'
import { Coin } from './coin.js'
import { Star } from './star.js'
import { Starticle } from './particles/stars.js'

export class World {
    constructor() {
        this.scene = new c.Scene()
        this.player = new Player(this.scene)
        this.gltfLoader = new GLTFLoader()
        this.waterfall = null
        this.playerspawn = null
        this.roof = null
        this.platform = null
        this.balltrap = null
        this.platformBox = new c.Box3()
        this.balltrapBox = new c.Box3()
        this.roofBox = new c.Box3()
        this.sun = new c.DirectionalLight('white', 1)
        this.terrain = null
        this.bridge = null
        this.water = new Water()
        this.textureLoader = new c.TextureLoader()
        this.file = './assets/models/castle.glb'
        this.raycaster = new c.Raycaster()
        this.gravity = 0.02
        this.collisionarr = []
        this.playerBox = new c.Box3()
        this.lastPos = new c.Vector3()
        this.fallAudio = new Audio()
        this.fallAudio.src = './assets/audio/fallaudio.wav'
        this.fallAudio.volume = 0.3
        this.mammamia = new Audio()
        this.mammamia.src = './assets/audio/mammamia.wav'
        this.mammamia.volume = 0.3
        this.qblockarr = []
        this.tunnel = null
        this.tunnel2 = null
        this.coinspawnarr = []
        this.coinarr = []
        this.tunnelBox = new c.Box3()
        this.tunnelBox2 = new c.Box3()
        this.goomby = new Goomba(this.scene)
        this.goombyBox = new c.Box3()
        this.goombyTalk = false
        this.starticle = new Starticle(this.scene)
        this.star1 = new Star(this.scene)
        this.star1.object.visible = false
        this.starBox1 = new c.Box3()
        this.star2 = new Star(this.scene)
        this.starBox2 = new c.Box3()
        this.star1Collected = false
        this.star2Collected = false
        this.starspawn = null
        this.ready = this.load()
    }

    coinCollect() {
        switch (this.player.coinCount) {
            case 1:
                s.coin1.play()
                break
            case 2:
                s.coin2.play()
                break
            case 3:
                s.coin3.play()
                break
            case 4:
                s.coin4.play()
                break
            case 5:
                s.coin5.play()
                break
            case 6:
                s.coin6.play()
                break
            case 7:
                s.coin7.play()
                break
            case 8:
                s.coin8.play()
                break
        }
    }

    collisions(lastPos) {
        if (!this.player.alive) {
            return
        }

        this.player.onPlatform = false
        
        this.playerBox.setFromObject(this.player.object)
        this.playerBox.expandByScalar(-0.2)
        
        this.goombyBox.setFromObject(this.goomby.object)
        this.goombyBox.expandByScalar(0.8)

        this.platformBox.setFromObject(this.platform)
        
        this.balltrapBox.setFromObject(this.balltrap)
        this.balltrapBox.expandByScalar(-0.05)

        this.starBox2.setFromObject(this.star2.object)

        if (this.star1.object.visible) {
            this.starBox1.setFromObject(this.star1.object)
        }

        if (this.playerBox.intersectsBox(this.balltrapBox)) {
            this.player.killMario()
        }

        if (this.player.alive && this.playerBox.intersectsBox(this.platformBox)) {
            const blockTop = this.platformBox.max.y
            const marioFeet = this.playerBox.min.y        
                    
            if (marioFeet >= blockTop - 0.5 && !this.player.onPlatform) {
                this.player.onPlatform = true
                this.player.object.position.y = blockTop - 0.19
                this.player.yvel = 0
                this.player.canJump = true
                this.player.onGround = true
            }
        }

        if (this.playerBox.intersectsBox(this.starBox1) && !this.star1Collected) {
            this.star1.object.visible = false
            this.star1Collected = true
            this.player.starCount++
            s.getStar.play()
            this.player.dance()
            setTimeout(() => {
                this.player.dance()
            }, 3000)
            this.star1.object.parent.remove(this.star1.object)
        }

        if (this.playerBox.intersectsBox(this.starBox2) && !this.star2Collected) {            this.star1.object.visible = false
            this.star2Collected = true
            this.player.starCount++
            s.getStar.play()
            this.player.dance()
            setTimeout(() => {
                this.player.dance()
            }, 3000)
            this.star2.object.parent.remove(this.star2.object)
        }


        this.tunnelBox.setFromObject(this.tunnel)
        this.player.onPipe = false
        if (this.playerBox.intersectsBox(this.tunnelBox)) {
            const pipeTop = this.tunnelBox.max.y
            const marioFeet = this.playerBox.min.y

            if (marioFeet >= pipeTop - 0.2) {
                this.player.onPipe = true
                this.player.object.position.y = pipeTop - 0.19
                this.player.yvel = 0
                this.player.onGround = true
                this.player.canJump = true
            } 
        }

        this.collisionarr.forEach(collision => {
            if (this.playerBox.intersectsBox(collision.box)) {
                if (collision.type === 'wall' || collision.type === 'tree') {
                    this.player.object.position.copy(lastPos)
                }

                if (collision.type === 'brick') {
                    const blockTop = collision.box.max.y
                    const marioFeet = this.playerBox.min.y

                    if (marioFeet >= blockTop - 0.2) {
                        this.player.object.position.y = blockTop - 0.19
                        this.player.yvel = 0
                        this.player.onGround = true
                        this.player.canJump = true
                    }
                }
        

                if (collision.type === 'coin') {
                    const coin = collision.coin
                    if (!collision.coin.object.userData.isCollected) {
                        collision.coin.object.userData.isCollected = true
                        this.player.coinCount++
                        this.coinCollect()
                        collision.coin.object.parent.remove(collision.coin.object)
                        this.coinarr = this.coinarr.filter(c => c !== coin)
                        this.collisionarr = this.collisionarr.filter(c => c.coin !== coin)
                    }
                }

                if (collision.type === 'roof') {
                    const roofTop = collision.box.max.y - 0.4
                        
                    this.player.yvel = 0
                    this.player.onGround = true
                    this.player.canJump = true
                    this.player.object.position.y = roofTop + 0.2            
                }

                if (collision.type === 'qblock') {
                    const blockTop = collision.box.max.y
                    const blockBottom = collision.box.min.y
                    const marioHead = this.playerBox.max.y
                    const marioFeet = this.playerBox.min.y        
                    
                    if (marioFeet >= blockTop - 0.5) {
                        this.player.object.position.y = blockTop - 0.19
                        this.player.yvel = 0
                        this.player.canJump = true
                        this.player.onGround = true
                    }
                }
            }
        })

        if (this.playerBox.intersectsBox(this.goombyBox)) {
            this.goombyTalk = true
        } else {
            this.goombyTalk = false
        }

        this.tunnelBox2.setFromObject(this.tunnel2)
        this.player.onPipe2 = false
        if (this.playerBox.intersectsBox(this.tunnelBox2)) {
            const pipeTop = this.tunnelBox2.max.y
            const marioFeet = this.playerBox.min.y

            if (marioFeet >= pipeTop - 0.2) {
                this.player.onPipe2 = true
                this.player.object.position.y = pipeTop - 0.19
                this.player.yvel = 0
                this.player.onGround = true
                this.player.canJump = true
            } 
        }

        this.raycaster.set(
            new c.Vector3(this.player.object.position.x, this.player.object.position.y, this.player.object.position.z),
            new c.Vector3(0, -1, 0)
        )

        const intersects = this.raycaster.intersectObject(this.terrain, true)
        const bridgeIntersects = this.raycaster.intersectObject(this.bridge, true)
       
        if (intersects.length > 0) {
            const pointY = intersects[0].point.y
            const playerHeight = 0.5
            const dist = this.player.object.position.y - pointY

            if (dist <= playerHeight + 0.3 && this.player.yvel >= 0) {
                this.player.object.position.y = pointY + (playerHeight - 0.3)
                this.player.yvel = 0
                this.player.canJump = true
                this.player.onGround = true
            }
        }

        if (bridgeIntersects.length > 0) {
            const pointY = bridgeIntersects[0].point.y
            const playerHeight = 0.5
            const dist = this.player.object.position.y - pointY

            if (dist <= playerHeight + 0.3 && this.player.yvel >= 0) {
                this.player.object.position.y = pointY + playerHeight
                this.player.yvel = 0
                this.player.canJump = true
                this.player.onGround = true
            }
        }
    }

    update() {
        if (this.playerspawn && !this.player.isLoaded) {
            this.player.isLoaded = true
            this.player.object.position.copy(this.playerspawn.position)
            this.player.object.position.y = 0.5
        }

        if (this.player.isLoaded) {
            this.player.yvel += this.gravity
            this.player.object.position.y -= this.player.yvel
        }

        if (!this.player.isFalling && this.player.object.position.y < -10) {
            this.player.isFalling = true
            this.fallAudio.currentTime = 0
            this.fallAudio.play()
        }

        if (this.player.object.position.y <= -160) {
            this.player.yvel = 0
            this.player.isFalling = false
            this.player.object.position.y = 0
            this.player.object.position.x = 0.4
            this.player.object.position.z = -6
            setTimeout(() => {
                this.fallAudio.pause()
                this.mammamia.play()
            }, 1000)
        }

        this.coinarr.forEach((coin) => {
            coin.object.rotation.y += 0.03
        })

        this.collisionarr.forEach(collision => {
            if (collision.type === 'coin') {
                collision.box.setFromObject(collision.coin.object)
            }

            if (collision.type === 'qblock') {
                collision.box.setFromObject(collision.block)
            }
        })

        if (this.star1 && this.star1.object.visible && !this.star1Collected) {
            this.star1.model.rotation.y += 0.06
            this.starticle.emit(this.star1.object.position, 0.5)
        }
        
        this.player.dustUpdate()
        this.starticle.update()

        this.lastPos = this.player.object.position.clone()
        this.player.playerMovement()
        this.collisions(this.lastPos)

        this.goomby.update()

        this.water.material.uniforms['time'].value += 1.0 / 120.0

        this.sun.target.position.copy(this.player.object.position)
        this.sun.updateMatrixWorld()
        this.sun.target.updateMatrixWorld()
    }

    load() {
        return new Promise(res => {
            this.textureLoader.load(
                './assets/processing/marioskybg.jpg',
                (texture) => {
                    this.scene.background = texture
                }
            )

        this.gltfLoader.load(
            this.file,
            (glb) => {
                const model = glb.scene
                
                model.scale.set(2, 2, 2)

                model.updateMatrixWorld()

                let id = 0

                model.traverse((child) => {
                    if (child.name === 'platform') {
                        this.platform = child
                    }

                    if (child.name === 'balltrap') {
                        this.balltrap = child
                    }

                    if (child.name.startsWith('tree')) {
                        child.castShadow = true
                        const box = new c.Box3()
                        box.setFromObject(child)
                        box.expandByScalar(-0.9)
                        const obj = {
                            type: 'tree',
                            box: box
                        }
                        this.collisionarr.push(obj)
                    }

                    if (child.isMesh && child.name.startsWith('questionblock00')) {
                        child.castShadow = true
                        this.qblockarr.push(child)
                    }

                    if (child.name.startsWith('coin')) {
                        child.castShadow = true
                        this.coinspawnarr.push(child)
                    }

                    if (child.name === 'bridge') {
                        this.bridge = child
                    }

                    if (child.name === 'starspawn') {
                        this.starspawn = child
                    }

                    if (child.name.includes('brick')) {
                        const box = new c.Box3()
                        box.setFromObject(child)
                        const obj = {
                            type: 'brick',
                            box: box,
                            obj: child
                        }
                        this.collisionarr.push(obj)
                    }

                    if (child.name.startsWith('collision')) {
                        child.visible = false
                        const box = new c.Box3()
                        box.setFromObject(child)
                        const obj = {
                            type: 'wall',
                            box: box
                        }
                        this.collisionarr.push(obj)
                    }

                    if (child.name === 'castle') {
                        child.castShadow = true
                        child.receiveShadow = true
                    }

                    if (child.name.includes('roof')) {
                        const box = new c.Box3()
                        box.setFromObject(child)
                        child.visible = false
                        const obj = {
                            type: 'roof',
                            box: box
                        }
                        this.collisionarr.push(obj)
                    }

                    if (child.name === 'waterfall') {
                        this.waterfall = child.material
                    }

                    if (child.name === 'tunnel') {
                        this.tunnel = child
                    }

                    if (child.name === 'tunnel2') {
                        this.tunnel2 = child
                    }

                    if (child.name === 'terrain') {
                        this.terrain = child
                        child.receiveShadow = true
                        child.castShadow = true
                    }

                    if (child.name === 'playerspawn') {
                        this.playerspawn = child
                    }

                    if (child.name === 'hills') {
                        child.material = new c.MeshToonMaterial({
                            map: child.material.map,
                            alphaTest: 0.8
                        })
                        child.material.envMapIntensity = 1
                        child.material.emissiveIntensity = 0.8
                    }

                    if (child.name.startsWith('cloud')) {
                        child.material = new c.MeshToonMaterial({
                            map: child.material.map
                        })
                        child.castShadow = true
                    }
                })

                
                this.coinspawnarr.forEach(spawn => {
                    const coin = new Coin(this.scene)
                    coin.object.userData = {
                        id: id,
                        isCollected: false
                    }
                    id++
                    const box = new c.Box3()
                    const obj = {
                        type: 'coin',
                        box: box,
                        coin: coin
                    }
                    this.collisionarr.push(obj)
                    this.coinarr.push(coin)
                })

                this.coinarr.forEach((coin, i) => {                  
                    const pos = new c.Vector3()
                    this.coinspawnarr[i].getWorldPosition(pos)
                    coin.object.position.copy(pos)
                })

                this.qblockarr.forEach(block => {
                    const box = new c.Box3()
                    const obj = {
                        block: block,
                        box: box,
                        type: 'qblock'
                    }
                    this.collisionarr.push(obj)
                })

                this.scene.updateMatrixWorld(true)
                this.scene.add(model)
                res()
            }
        )

        const d = 20
        this.sun.position.set(80, 150, 0)
        this.sun.castShadow = true
        this.sun.shadow.mapSize.set(2048, 2048)
        this.sun.shadow.camera.left = -d
        this.sun.shadow.camera.right = d
        this.sun.shadow.camera.top = d
        this.sun.shadow.camera.bottom = -d
        this.sun.target.position.set(0, 0, 0)
        this.sun.shadow.bias = -0.001
        this.scene.add(this.sun.target)
        this.scene.add(this.sun)
        const hemiLight = new c.HemisphereLight(0xb1e1ff, 'white', 0.6)
        this.scene.add(hemiLight)

        const sunGeo = new c.SphereGeometry(12)
        const sunMat = new c.MeshPhongMaterial({ color: 'yellow', emissive: 'yellow', emissiveIntensity: 0.8 })
        const sunOrb = new c.Mesh(sunGeo, sunMat)
        this.sun.add(sunOrb)

        const shelper = new c.CameraHelper(this.sun.shadow.camera)
        //this.scene.add(shelper)

        const waterGeo = new c.PlaneGeometry(110, 140)

        this.water = new Water(waterGeo, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: this.textureLoader.load(
                './assets/processing/waternormals.jpg',
                (texture) => {
                    texture.wrapS = texture.wrapT = c.RepeatWrapping
                }
            ),
            sunDirection: new c.Vector3(),
            sunColor: 'yellow',
            waterColor: 'blue',
            distortionScale: 3
        })
        this.water.material.uniforms['sunDirection'].value.copy(this.sun.position).normalize()
        this.water.rotation.x = -Math.PI / 2
        this.water.position.y = -1.2
        this.scene.add(this.water)


        this.star1.object.position.set(4, 1, -3)
        })
    }
}