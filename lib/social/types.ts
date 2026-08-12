export interface SocialConnection {
  connected: true;
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  igUserId: string;
  igUsername: string;
  connectedAt: string;
}
export interface PublishInput {
  imageUrls: string[];
  caption: string;
  toInstagram: boolean;
  toFacebook: boolean;
}
export interface PublishResult {
  instagram?: { mediaId: string; permalink?: string };
  facebook?: { postId: string };
  errors: string[];
}
export interface SocialPostLog {
  itemId: string;
  itemType: 'vehicule' | 'moto';
  platforms: string[];
  caption: string;
  postedAt: string;
  igPermalink?: string;
  fbPostId?: string;
}
