import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class AuthController {
  public async login ({ request, auth }: HttpContextContract) {
    const email = request.input('email')
    const password = request.input('password')

    let token
    try {
      token = await auth.use('api')
        .attempt(email, password, {expiresIn: '1 days'})
        .then(data => data.token)
    } catch (error) {
      throw new Error('Aconteceu algun erro ao tentar logar.Tente novamente!!')
    }

    return token
  }

  public async logout ({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').logout()
    } catch (error) {
      throw new Error('Error ao tentar deslogar')
    }

    response.status(200)
  }

  public async checkToken ({ auth}: HttpContextContract) {
    return auth.check()
  }

  public async retriveUserByToken ({ auth}: HttpContextContract) {
    const user =  auth.user
    
    return {
      id: user?.id,
      name: user?.name, 
      nick: user?.nick, 
      email: user?.email,
      biografia: user?.biografio,
      avatar: user?.avatar,
    }
  }
}
