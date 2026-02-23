import { readFileSync, writeFileSync } from 'fs'
import { parseWorkbook } from '../src/parse.js'

const buf = readFileSync('public/housing.xlsx')
const data = parseWorkbook(buf.buffer)
writeFileSync('public/housing.json', JSON.stringify(data))
console.log('✅ housing.json generated')