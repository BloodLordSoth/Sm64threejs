import * as c from 'three'

export class Starticle {
    constructor(scene, maxParticles = 200) {
        this.scene = scene
        this.maxParticles = maxParticles
        
        const positions = new Float32Array(maxParticles * 3)
        const velocities = new Float32Array(maxParticles * 3)
        const lifetimes = new Float32Array(maxParticles)
        
        this.positions = positions
        this.velocities = velocities
        this.lifetimes = lifetimes
        
        this.geometry = new c.BufferGeometry()
        this.geometry.setAttribute('position', new c.BufferAttribute(positions, 3))
        
        this.maploader = new c.TextureLoader()
        this.map = this.maploader.load('./assets/processing/star.png')
        
        this.material = new c.PointsMaterial({
            map: this.map,
            transparent: true,
            depthWrite: false,
            opacity: 0.4,
            color: 'yellow',
            size: 0.4
        })
        
        this.points = new c.Points(this.geometry, this.material)
        this.index = 0
        this.scene.add(this.points)
    }

    update() {
        for (let i = 0; i < this.maxParticles; i++) {
            if (this.lifetimes[i] <= 0) {
                const i3 = i * 3
                this.positions[i3 + 1] = -9999
                continue
            }

            const i3 = i * 3

            this.positions[i3 + 0] += this.velocities[i3 + 0]
            this.positions[i3 + 1] += this.velocities[i3 + 1]
            this.positions[i3 + 2] += this.velocities[i3 + 2]

            this.velocities[i3 + 0] *= 0.96
            this.velocities[i3 + 1] *= 0.96
            this.velocities[i3 + 2] *= 0.96

            this.lifetimes[i] -= 0.015
        }
        this.geometry.attributes.position.needsUpdate = true
    }

    emit(pos, count = 20) {
        for (let i = 0; i < count; i++) {
            const i3 = this.index * 3

            this.positions[i3 + 0] = pos.x + (Math.random() - 0.5) * 0.02
            this.positions[i3 + 1] = pos.y - 0.3
            this.positions[i3 + 2] = pos.z + (Math.random() - 0.5) * 0.02

            this.velocities[i3 + 0] = (Math.random() - 0.5) * 0.07
            this.velocities[i3 + 1] = Math.random() * 0.04
            this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.07

            this.lifetimes[this.index] = 1.0
            this.index = (this.index + 1) % this.maxParticles
        }
    }
}