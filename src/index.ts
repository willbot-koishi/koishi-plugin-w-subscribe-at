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

const getMemberName = async (session: Session, uid: string) => {
    const member = await session.bot.getGuildMember(session.guildId, uid.split(':')[1])
    return member.nick || member.user.nick || member.user.name || uid
}

const escape = (content: string) => h
    .parse(content)
    .map(el => {
        if (el.type === 'at') return '@'
        return el.toString()
    })
    .join('')

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
        render: async (session, msg) => `${escape(msg.content)} <- ${await getMemberName(session, msg.sender)}`,
        schema: z.object({
            level: z.union([ z.const('never'), z.const('always'), z.const('selected') ]).required(),
            guilds: z.array(z.string()).default([])
        })
    })

    ctx.on('dispose', () => {
        dispose()
    })
}
