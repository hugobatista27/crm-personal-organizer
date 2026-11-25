/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
const ClientsController = () => import('#controllers/clients_controller')
const DiaristasController = () => import('#controllers/diaristas_controller')
const ServiceTypesController = () => import('#controllers/service_types_controller')
const AgendaController = () => import('#controllers/agenda_controller')

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
        router.get('me', [controllers.Profile, 'show']).use(middleware.auth())
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())
  })
  .prefix('/api/v1')

router
  .group(() => {
    for (const [path, controller] of [
      ['clients', ClientsController],
      ['diaristas', DiaristasController],
      ['service-types', ServiceTypesController],
    ] as const) {
      router.get(path, [controller, 'index'])
      router.get(`${path}/:id`, [controller, 'show'])
      router.post(path, [controller, 'store']).use(middleware.role(['ADMIN']))
      router.put(`${path}/:id`, [controller, 'update']).use(middleware.role(['ADMIN']))
      router.delete(`${path}/:id`, [controller, 'destroy']).use(middleware.role(['ADMIN']))
    }
  })
  .prefix('/api/v1')
  .use(middleware.auth())

router
  .group(() => {
    router.get('agenda', [AgendaController, 'index'])
    router
      .post('agenda/check-availability', [AgendaController, 'checkAvailability'])
      .use(middleware.role(['ADMIN']))
  })
  .prefix('/api/v1')
  .use(middleware.auth())
