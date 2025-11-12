/**
 * Database Models Index
 * Export all model instances and classes
 */

export { BaseModel } from './base-model';
export { UserModel, userModel } from './user';
export { ServiceModel, serviceModel } from './service';
export { TalkModel, talkModel } from './talk';
export { CommunityModel, communityModel } from './community';

// Export all models as a single object for convenience
export const models = {
  user: userModel,
  service: serviceModel,
  talk: talkModel,
  community: communityModel,
};

export default models;
