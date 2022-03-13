import express from 'express'
import urllib from 'urllib'

// const STATES = {
//   0: 'off',
//   1: 'heating',
//   2: 'cooling',
//   3: 'lockout',
//   4: 'error'
// }

const STATES = [
  'off',
  'heating',
  'cooling',
  'lockout',
  'error'
]

// const FAN_STATES = {
//   0: 'off',
//   1: 'on'
// }

const FAN_STATES = [
  'off',
  'on'
]

async function getAll() {
  const response = await urllib.request(
    `https://${process.env.VENSTAR_IP ?? ''}/query/info`,
    {
      dataType: 'json',
      digestAuth: `${process.env.VENSTAR_USERNAME}:${process.env.VENSTAR_PASSWORD}`,
      rejectUnauthorized: false
    }
  )

  return response.data
}

async function getMetrics() {
  const json = await getAll()

  return {
    name: json.name,
    temperature: json.spacetemp as number,
    heat_temp: json.heattemp as number,
    cool_temp: json.cooltemp as number,
    humidity: json.hum as number,
    state: STATES[json.state as number],
    fan_state: FAN_STATES[json.fanstate as number]
  }
}

function main() {
  const app = express()

  app.get(process.env.HEALTH_PATH ?? '/healthz', (_req, res) => res.send({status: 'up'}))

  app.get(process.env.METRICS_PATH ?? '/metrics', async (req, res) => {
    let metrics: { [key: string]: number | string }
    try {
      metrics = await getMetrics()
    }
    catch (e: any) {
      console.error('Error getting metrics!!!', e)
      res.status(500).send({ status: 'ERROR' })
      return
    }
    res.send(metrics)
  })

  app.listen(
    parseInt(process.env.PORT ?? '8001'),
    process.env.HOST ?? '0.0.0.0',
    () => console.log('Server is running!!!')
  )
}

try {
  main()
} catch (e: any) {
  console.error('Error during startup!!!')
  console.error(e.message, e.stack)
  process.exit(1)
}
