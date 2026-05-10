import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import path from 'path'

const app = express()
const PORT = 6776
app.use(cors())
const __file = fileURLToPath(import.meta.url)
const __dir = path.dirname(__file)
app.use(express.static(path.join(__dir, 'frontend')))

app.listen((PORT), () => {
    console.log(`listening on localhost:${PORT}`)
})