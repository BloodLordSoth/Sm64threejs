import * as c from 'three'
import * as s from './scripts/audioFiles.js'
import { World } from './scripts/world.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { DustParticle } from './scripts/particles/dust.js'
import { tunnelSound } from './scripts/audioFiles.js'
import { Intro } from './scripts/introscene.js'
import { EndScene } from './scripts/endscene.js'

const gameBox = document.getElementById('gameBox')
const coinCount = document.getElementById('coinCount')
const starCount = document.getElementById('starCount')
const actionText = document.getElementById('actionText')
const dialogue = document.getElementById('dialogue')
const botBar = document.getElementById('botBar')
const topBar = document.getElementById('topBar')
const beginBtn = document.getElementById('begin')
const playGame = document.getElementById('playGame')
const fadeBox = document.getElementById('fadeBox')
const thanksBox = document.getElementById('thanks')
const helpText = document.getElementById('help')
const gameWidth = gameBox.clientWidth
const gameHeight = gameBox.clientHeight

let gameState = 'game'

const world = new World()
const intro = new Intro()
const ending = new EndScene(gameWidth, gameHeight)
const camera = new c.PerspectiveCamera(75, gameWidth / gameHeight, 0.1, 1000)
camera.position.set(0, 5, 0)
const follow = new c.Vector3(0, 2, -2.5)

const dust = new DustParticle(world.scene)

const renderer = new c.WebGLRenderer()
renderer.setSize(gameWidth, gameHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.toneMapping = c.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.shadowMap.enabled = true
renderer.shadowMap.type = c.PCFShadowMap
const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(intro.scene, camera)
composer.addPass(renderPass)
composer.addPass(new UnrealBloomPass({ x: gameWidth, y: gameHeight }, 0.1, 0, 0.7))
composer.addPass(new OutputPass())

function gameInit() {
    topBar.style.display = 'flex'
    botBar.style.display = 'flex'
    renderPass.scene = world.scene
    renderPass.camera = camera
}

function gameStart() {
    renderer.setAnimationLoop(gameLoop)
    gameBox.appendChild(renderer.domElement)
}

async function bootUp() {
    await Promise.all([
        world.ready,
        intro.ready,
        ending.ready
    ])
    gameStart()
}
bootUp()

function gameEnd() {
    topBar.style.display = 'none'
    botBar.style.display = 'none'
    renderer.setAnimationLoop(endLoop)
    renderPass.scene = ending.scene
    renderPass.camera = ending.camera
    setTimeout(() => {
        s.gameoverAudio.play()
    }, 2000)
    setTimeout(() => {
        ending.talk.play()
    }, 3000)
    setTimeout(() => {
        ending.talk.stop()
    }, 3400)
    setTimeout(() => {
        ending.talk.play()
    }, 7000)
    setTimeout(() => {
        ending.talk.stop()
    }, 8000)
    setTimeout(() => {
        fadeBox.style.display = 'flex'
        fadeBox.style.animation = 'fade-in 2s forwards'
    }, 10000)
    setTimeout(() => {
        s.thankyou.play()
        thanksBox.style.display = 'flex'
        ending.scene.clear()
    }, 12000)
}

function endLoop() {
    const delta = clock.getDelta()
    ending.mixer?.update(delta)
    composer.render()
}

const clock = new c.Clock()

function animate() {
    requestAnimationFrame(animate)
    const time = performance.now() * 0.002
    if (world.waterfall) {
        world.waterfall.map.offset.y += -0.006
    }

    if (world.qblockarr.length > 0)     {
        world.qblockarr.forEach(block => {
            block.material.emissiveIntensity = 0.9
            if (block.material.map) {
                block.material.map.offset.x += 0.006
            }
        })
    }
}
animate()

let hasCoins = false
let all8coins = false

function gotAllCoins() {
    starAppear()
    setTimeout(() => {
        hasCoins = true
        camera.position.set(30, 6, -10)
        camera.lookAt(world.tunnel.position)
        world.tunnel.visible = true
        setTimeout(() => {
            raiseTunnel()
            tunnelSound.play()
        }, 1000)
        setTimeout(() => {
            hasCoins = false
        }, 3000)
    }, 5000)
    
}

export function raiseTunnel() {
    requestAnimationFrame(raiseTunnel)

    let height = 0.32
    if (world.tunnel.position.y <= height) {
        world.tunnel.position.y += 0.03
    }
}

let target = new c.Vector3()
let tunnel2Loc = new c.Vector3()
let tunnel1Loc = new c.Vector3()
let tunnel2Target = new c.Vector3()
let focusStar1 = false
let focusGoomby = false
let starPos = new c.Vector3()
let bgMusic = false

function gameLoop() {
    if (gameState === 'game') {
        if (!world.player || !world.terrain || !world.tunnel || !world.tunnel2 || !world.platform || !world.balltrap || !world.starspawn) {
            composer.render()
            return
        }
        dust.update()
        coinCount.innerText = `${world.player.coinCount}/8`
        starCount.innerText = `${world.player.starCount}`

        world.tunnel.getWorldPosition(tunnel1Loc)
        world.tunnel.updateMatrixWorld(true)

        world.tunnel2.updateMatrixWorld(true)
        world.tunnel2.getWorldPosition(tunnel2Loc)

        world.platform.rotation.y -= 0.003
        world.balltrap.rotation.y += 0.03
        
        world.starspawn.getWorldPosition(starPos)
        starPos.y += 0.75
        world.star2.object.position.copy(starPos)
        world.star2.model.rotation.y += 0.06
        if (!world.star2Collected) {
            world.starticle.emit(world.star2.object.position, 0.5)
        }
        
        target = world.player.object.position.clone()
        target.y += 1
        const delta = clock.getDelta()
        world.update()
        world.player.mixer?.update(delta)
        world.goomby.mixer?.update(delta)

        if (intro.isTalking) {
            intro.mixer?.update(delta)
        }

        if (bgMusic) {
            s.bgMusic.play()
            if (s.bgMusic.currentTime >= 137) {
                s.bgMusic.currentTime = 0
            }
        } else {
            s.bgMusic.pause()
        }

        if (!all8coins && world.player.coinCount >= 8) {
            all8coins = true
            gotAllCoins()
        }

        if (!hasCoins && !focusStar1) {
            const offset = follow.clone().applyAxisAngle(new c.Vector3(0, 1, 0), world.player.object.rotation.y)
            const dir = world.player.object.position.clone().add(offset)
            camera.position.lerp(dir, 0.2)
            camera.lookAt(target) 
        } else if (focusStar1) {
            camera.lookAt(world.star1.object.position)
        } else if (focusGoomby) {
            camera.lookAt(world.goomby.object.position)
        }

        if (world.goombyTalk && !world.player.inConvo) {
            actionText.style.display = 'flex'
            actionText.innerText = `[Enter] Speak`
        } else if (world.player.onPipe || world.player.onPipe2) {
            actionText.style.display = 'flex'
            actionText.innerText = `[Enter] Enter Pipe`
        } else {
            actionText.style.display = 'none'
            actionText.innerText = ``
        }

         

        composer.render()
    }
    
}

let dance = false

let convoP1 = true
let convoP2 = false

document.addEventListener('keydown', (e) => {
    if (!world.player.inConvo && !world.player.isDancing) {
        switch (e.key) {
            case 'w':
                world.player.move.forward = true
                break
            case 's': 
                world.player.move.back = true
                break
            case 'Enter':
                if (world.player.onPipe) {
                    world.player.downPipe(tunnel2Loc)
                } else if (world.player.onPipe2) {
                    world.player.downPipe(tunnel1Loc)
                } else if (world.goombyTalk && convoP1) {
                    goombyConvo1()
                } else if (world.goombyTalk && convoP2) {
                    goombyConvo2()
                }
                break
            case 'a':
                world.player.move.left = true
                break
            case 'd':
                world.player.move.right = true
                break
            case '0':
                document.documentElement.requestFullscreen()
                break
            case ' ':
                jumpHandler()
                break
        }
    }
    
})

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'w':
            world.player.move.forward = false
            break
        case 's':
            world.player.move.back = false
            break
        case 'a':
            world.player.move.left = false
            break
        case 'd':
            world.player.move.right = false
            break
    }
})

document.addEventListener('wheel', (e) => {
    if (e.deltaY < 0) {
        camera.zoom += 0.02
    }

    if (e.deltaY > 0) {
        camera.zoom -= 0.02
    }

    camera.updateProjectionMatrix()
})

let starZoom;

function starAppear() {
    focusStar1 = true
    world.star1.object.visible = true
    camera.position.set(5, 4, -10)
    s.starAppear.play()
    zoomIn()
    
    setTimeout(() => {
        focusStar1 = false
        zoomOut()
    }, 5000)
}

let jumpTime = 3
let jumpCount = 0
function jumpHandler() {
    if (world.player.canJump) {
        world.player.canJump = false
        world.player.isJumping = true
        dust.emit(world.player.object.position, 10)
        if (jumpCount === 0) {
            jumpCount++
            const jumpInterval = setInterval(() => {
                jumpTime--

                if (jumpTime === 0) {
                    clearInterval(jumpInterval)
                    jumpCount = 0
                    jumpTime = 3
                }
            }, 300)
            s.yah.play()
            world.player.yvel = -0.35
            setTimeout(() => {
                world.player.isJumping = false
            }, 550)
        } else if (jumpCount === 1 && jumpTime < 3) {
            jumpCount++
            s.hooAudio.play()
            world.player.yvel = -0.4
            setTimeout(() => {
                world.player.isJumping = false
            }, 600)
        }
        
    }
}

window.addEventListener('resize', () => {
    resizeClient()
})

beginBtn.onclick = () => {
    beginBtn.style.display = 'none'
    helpText.style.display = 'none'
    intro.startScene()
    s.almostMario.play()
    setTimeout(() => {
        s.titleAudio.play()
    }, 2000)
    setTimeout(() => {
        playGame.style.display = 'flex'
    }, 4000)
}

playGame.onclick = () => {
    playGame.style.display = 'none'
    s.selectSound.play()
    s.okeyDokey.play()
    s.titleAudio.pause()
    intro.scene.clear()
    bgMusic = true
    gameInit()
}

function resizeClient() {
    const width = gameBox.clientWidth
    const height = gameBox.clientHeight
    camera.aspect = width / height
    renderer.setSize(width, height)
    composer.setSize(width, height)
    camera.updateProjectionMatrix()
}

async function goombyConvo1() {
    zoomIn()
    
    if (convoP1) {
        convoP1 = false
        s.bgMusic.volume = 0.06
        world.player.object.visible = false
        world.goomby.model.lookAt(world.player.object.position)
        world.player.inConvo = true
        dialogue.style.display = 'flex'
        const str = 'Help me Mario!'
        const str2 = 'There are 2 power stars that were taken from me!'
        const str3 = 'I beg you! pwetty please return them?'
        const msg = document.createElement('p')
        msg.classList.add('goombytext')
        s.goombyTalk1.play()
        goombyText(str, msg)
        setTimeout(() => {
            s.goombyTalk3.play()
            msg.innerText = ''
            goombyText(str2, msg)
        }, 3000)
        setTimeout(() => {
            world.goomby.sadGoomby()
        }, 8000)
        setTimeout(() => {
            s.goombyTalk2.play()
            msg.innerText = ''
            goombyText(str3, msg)
        }, 8400)
        setTimeout(() => {
            world.goomby.shrinkGoomby()
            s.bgMusic.volume = 0.15
            convoP2 = true
            world.player.inConvo = false
            world.player.object.visible = true
            dialogue.style.display = 'none'
            msg.innerText = ''
            world.goomby.model.lookAt(0, 0, -20)
            zoomOut()
        }, 15000)
    }
}

function goombyConvo2() {
    zoomIn()
    
    if (convoP2 && world.player.starCount === 0) {
        convoP2 = false
        s.bgMusic.volume = 0.06
        world.player.object.visible = false
        world.goomby.model.lookAt(world.player.object.position)
        world.player.inConvo = true
        dialogue.style.display = 'flex'
        const str = 'Please Mario! I\'m counting on you.'
        world.goomby.sadGoomby()
        const msg = document.createElement('p')
        msg.classList.add('goombyText')
        s.goombyTalk1.play()
        goombyText(str, msg)
        setTimeout(() => {
           world.goomby.shrinkGoomby()
           s.bgMusic.volume = 0.15
           world.player.object.visible = true
           world.player.inConvo = false
           dialogue.style.display = 'none'
           msg.innerText = ''
           convoP2 = true
           world.goomby.model.lookAt(0, 0, -20)
           zoomOut()
        }, 6000)
    } else if (convoP2 && world.player.starCount === 1) {
        convoP2 = false
        s.bgMusic.volume = 0.06
        world.player.object.visible = false
        world.goomby.model.lookAt(world.player.object.position)
        world.player.inConvo = true
        world.goombyTalk = false
        dialogue.style.display = 'flex'
        const str = 'Oh thank you Mario!'
        const str2 = 'The kingdom is feeling much safer! Keep going!'
        const msg = document.createElement('p')
        msg.classList.add('goombyText')
        s.hoorayAudio.play()
        s.goombyTalk2.play()
        world.goomby.isDancing = true
        goombyText(str, msg)
        setTimeout(() => {
            s.goombyTalk3.play()
            msg.innerText = ''
            goombyText(str2, msg)
        }, 4000)
        setTimeout(() => {
            s.bgMusic.volume = 0.15
           world.player.object.visible = true
           world.player.inConvo = false
           dialogue.style.display = 'none'
           msg.innerText = ''
           convoP2 = true
           world.goomby.model.lookAt(0, 0, -20)
           world.goomby.isDancing = false
           zoomOut()
        }, 10000)
    } else if (convoP2 && world.player.starCount === 2) {
        convoP2 = false
        s.bgMusic.volume = 0.06
        world.player.object.visible = false
        world.goomby.model.lookAt(world.player.object.position)
        world.player.inConvo = true
        world.goombyTalk = false
        dialogue.style.display = 'flex'
        s.success.play()
        const str = 'Mario!!..'
        const str2 = 'I...I can\'t believe you\'d do that for lil ol\' me!'
        const str3 = 'Me...Goomby...Now infused with the power of STARS!'
        const msg = document.createElement('p')
        msg.classList.add('goombyText')
        s.goombyTalk2.play()
        goombyText(str, msg)
        setTimeout(() => {
            s.goombyTalk3.play()
            msg.innerText = ''
            goombyText(str2, msg)
        }, 5000)
        setTimeout(() => {
            bgMusic = false
            s.endMusic.play()
            const topIndex = world.goomby.morph.morphTargetDictionary.eyelidstop
            const botIndex = world.goomby.morph.morphTargetDictionary.eyelidsbottom
            world.goomby.morph.morphTargetInfluences[topIndex] = 0.77
            world.goomby.morph.morphTargetInfluences[botIndex] = 0.66
        }, 12000)
        setTimeout(() => {
            s.goombyTalk1.play()
            msg.innerText = ''
            goombyText(str3, msg)
            s.endMusic.volume = 0.1
        }, 14000)
        setTimeout(() => {
            world.player.starCount--
            s.popsfx.play()
            setTimeout(() => {
                s.popsfx.currentTime = 0
                s.popsfx.play()
                world.player.starCount--
            }, 800)
        }, 21000)
        setTimeout(() => {
            world.goomby.growGoomby()
            s.laughAudio.play()
            zoomOut()
        }, 23000)
        setTimeout(() => {
            world.player.object.visible = true
            dialogue.style.display = 'none'
            msg.innerText = ''
        }, 25000)
        setTimeout(() => {
            focusGoomby = true
            world.goomby.isMoving = true
            s.stompAudio.play()
            setTimeout(() => {
                world.player.killMario()
                s.endMusic.pause()
            }, 1500)
            setTimeout(() => {
                fadeBox.style.animation = 'fade-in 1s forwards'
                fadeBox.style.display = 'flex'
                world.scene.clear()
            }, 2200)
            setTimeout(() => {
                gameEnd()
            }, 4000)
            setTimeout(() => {
                fadeBox.style.animation = 'fade-out 1s forwards'
            }, 5500)
            setTimeout(() => {
                fadeBox.style.display = 'none'
            }, 6500)
        }, 27000)
    }
}

let zoomInID;
let zoomOutID;

function zoomIn() {
    if (camera.zoom <= 3) {
        camera.zoom += 0.04
        camera.updateProjectionMatrix()
        zoomInID = requestAnimationFrame(zoomIn)
    } else {
        cancelAnimationFrame(zoomInID)
    }
}

function zoomOut() {
    if (camera.zoom >= 1) {
        camera.zoom -= 0.04
        camera.updateProjectionMatrix()

        zoomOutID = requestAnimationFrame(zoomOut)
    } else {
        cancelAnimationFrame(zoomOutID)
    }
}

function goombyText(string, msg) {
    const clean = string.trim().split('')
    let i = 0
    setInterval(() => {
        if (i < clean.length) {
            msg.innerText += string[i]
            i++
            dialogue.appendChild(msg)
        }
    }, 100)
}