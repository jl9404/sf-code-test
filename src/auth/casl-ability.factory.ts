import { AbilityBuilder, PureAbility } from '@casl/ability';
import { PrismaQuery, Subjects, createPrismaAbility } from '@casl/prisma';
import { Injectable } from '@nestjs/common';
import { Activity, Todo } from '@prisma/client';
import { UserEntity } from 'src/users/entites/user.entity';
import { Action } from './constants';

export type AppAbility = PureAbility<
  [
    string,
    Subjects<{
      Todo: Todo;
      Activity: Activity;
    }>,
  ],
  PrismaQuery
>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: UserEntity) {
    const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    // Everyone can read activity feed
    can(Action.Read, 'Activity');

    // TODO: can be stored on db?
    if (user.roles.includes('READONLY_USER')) {
      can(Action.Read, 'Todo');
    }

    if (user.roles.includes('USER')) {
      can(Action.Create, 'Todo');
      can(Action.Read, 'Todo');
      can(Action.Update, 'Todo', { authorId: user.id });
      can(Action.Delete, 'Todo', { authorId: user.id });
    }

    if (user.roles.includes('ADMIN')) {
      can(Action.Create, 'Todo');
      can(Action.Read, 'Todo');
      can(Action.Update, 'Todo');
      can(Action.Delete, 'Todo');
    }

    return build();
  }
}
