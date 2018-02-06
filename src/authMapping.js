const { get } = require('lodash');
const { isMe, isMine } = require('./authResolvers');

const ROLES = {
  ANONYMOUS: 'ANONYMOUS',
  USER: 'USER',
};

module.exports = {
  [ROLES.ANONYMOUS]: {
    permissions: {
      user: {
        get: {
          id: true,
          name: true,
          createdAt: true,
          profileImage: true,
          timelines: 'timeline',
          events: 'event',
        },
        create: false,
        update: false,
        delete: false,
      },
      timeline: {
        get: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          user: 'user',
          events: 'event',
        },
        create: false,
        update: false,
        delete: false,
      },
      event: {
        get: {
          id: true,
          text: true,
          location: true,
          waveform: true,
          weather: true,
          audioFile: true,
          imageFile: true,
          imageBrightness: true,
          colorPalette: true,
          createdAt: true,
          updatedAt: true,
          user: 'user',
          timeline: 'timeline',
        },
        create: false,
        update: false,
        delete: false,
      },
    },
  },
  [ROLES.USER]: {
    inherits: ROLES.ANONYMOUS,
    permissions: {
      user: {
        get: {
          updatedAt: isMe().query,
          email: isMe().query,
        },
        create: false,
        update: {
          name: isMe().mutation,
          profileImage: isMe().mutation,
          password: isMe().mutation,
        },
        delete: isMe().mutation,
      },
      timeline: {
        create: {
          name: true,
          user: {
            connect: isMe({
              userIdPath: 'user.connect.where.id',
            }).mutation,
          }
        },
        update: {
          name: isMine('timeline').mutation,
        },
        delete: isMine('timeline').mutation,
      },
      event: {
        create: {
          text: true,
          location: true,
          waveform: true,
          weather: true,
          audioFile: true,
          imageFile: true,
          imageBrightness: true,
          colorPalette: true,
          timeline: {
            connect: isMine(
              'timeline',
              {
                resourceIdPath: 'timeline.connect.where.id',
              },
            ).mutation,
          },
          user: {
            connect: isMe({
              userIdPath: 'user.connect.where.id',
            }).mutation,
          },
        },
        update: {
          text: isMine('event').mutation,
        },
        delete: isMine('event').mutation,
      },
    },
  },
};
