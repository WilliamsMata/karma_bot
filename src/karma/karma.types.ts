import { User } from '../users/schemas/user.schema';
import { Karma } from './schemas/karma.schema';

export type PopulatedKarma = Karma & { user: User };
