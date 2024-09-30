import { Context, h, Schema, Session, z } from 'koishi'
import {} from 'koishi-plugin-w-subscribe'

export const name = 'w-subscribe-at'

export const inject = [ 'subscribe' ]

declare module 'koishi-plugin-w-subscribe' {
    interface SubscriptionRules {
        at: {
            level: 'never' | 'always' | 'selected'
            guilds: string[]
        }
    }
}

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
    const { dispose } = ctx.subscribe.rule('at', {
        filter: (session, config, subscriber) => {
            if (
                config.level === 'never' ||
                config.level === 'selected' && ! config.guilds.includes(session.gid)
            ) return false

            const [ platform, userId ] = subscriber.uid.split(':')
            return (
                session.platform === platform &&
                h.parse(session.content).some(el => el.type === 'at' && el.attrs.id === userId)
            )
        },
        render: async (session, msg) => {
            session.getMemberName ??= await ctx.subscribe.utils.getMemberNameGetter(session)
            return `${await ctx.subscribe.utils.escapeAt(session, msg)} <- ${session.getMemberName(msg.sender)}`
        },
        schema: z.object({
            level: z.union([ z.const('never'), z.const('always'), z.const('selected') ]).required(),
            guilds: z.array(z.string()).default([])
        })
    })

    ctx.on('dispose', () => {
        dispose()
    })
}
