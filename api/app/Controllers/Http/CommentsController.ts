// import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Comment from 'App/Models/Comment'
import Notification from 'App/Models/Notification'
import Post from 'App/Models/Post'
import User from 'App/Models/User'

import socketIo from 'App/Services/Ws'

export default class CommentsController {
  public async retriveByPostAndUser({ params, response }) {
    try {
      const { user_id, post_id } = params

      if (!user_id || !post_id)
        return response.status(400).json(
          `${post_id ? '' : 'missing post_id\n'}
          ${user_id ? '' : 'missing user_id\n'}`
        )

      const comments = await Comment.query().where({ user_id, post_id })
      return response.json(comments)
    } catch (e) {
      return response.status(500).json(e.message)
    }
  }

  public async retriveByPost({ params, response }) {
    try {
      const { post_id } = params

      if (!post_id)
        return response
          .status(400)
          .json(`${post_id ? '' : 'missing post_id\n'}`)

      const comments = await Comment.query().where({ post_id })
      return response.json(comments)
    } catch (e) {
      return response.status(500).json(e.message)
    }
  }

  public async retriveByUser({ params, response }) {
    try {
      const { user_id } = params

      if (!user_id)
        return response
          .status(400)
          .json(`${user_id ? '' : 'missing user_id\n'}`)

      const comments = await Comment.query().where({ user_id })
      return response.json(comments)
    } catch (e) {
      return response.status(500).json(e.message)
    }
  }

  public async retriveAll({ response }) {
    try {
      return response.json(await Comment.all())
    } catch (e) {
      return response.status(500).json(e.message)
    }
  }

  public async create({ request, response }) {
    try {
      const { post_id, user_id, text } = request.only([
        'post_id',
        'user_id',
        'text',
      ])

      if (!post_id || !user_id || !text)
        return response.status(400).json(
          `${post_id ? '' : 'missing post_id\n'}
          ${user_id ? '' : 'missing user_id\n'}
          ${text ? '' : 'missing text\n'}`
        )

      const post = await Post.query()
        .where({ id: post_id })
        .preload('community')
        .preload('userAlerts')
        .first()
      if (!post) {
        return response.status(404).json('Não existe o post')
      }
      const user = await User.find(user_id)
      if (!user) {
        return response.status(404).json('Não existe o usuário')
      }

      const comment = new Comment()
      comment.post_id = post_id
      comment.user_id = user_id
      comment.text = text

      await comment.related('user').associate(user)
      await comment.related('post').associate(post)

      post.comments++
      await post.save()

      post.userAlerts.forEach(async (com_user) => {
        const notification = new Notification()
        notification.user_id = com_user.id

        notification.text = `${user.name} comentou "${comment.text}" no post "${post.title}" na comunidade ${post.community.name}.`

        notification.post_id = post.id
        notification.is_new = true

        await notification.related('user').associate(com_user)
        await notification.related('post').associate(post)

        socketIo.emit(`new-notify-${com_user.id}`, notification)
      })

      return response.status(201).json(comment)
    } catch (e) {
      return response.status(500).json(e.message)
    }
  }

  public async delete({ params, response }) {
    try {
      const { id } = params

      if (!id) return response.status(400).json('missing id')

      const comment = await Comment.query().where({ id }).first()

      if (!comment) return response.status(404).json('comment not found')

      const deletedComment = comment.delete()

      if (deletedComment) return response.status(204)
      else return response.status(500).json('some error occurred')
    } catch (e) {
      return response.status(500).json(e.message)
    }
  }
}
