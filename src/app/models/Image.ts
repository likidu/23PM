export interface Image {
  picUrl: string;
  largePicUrl: string;
  middlePicUrl: string;
  smallPicUrl: string;
  thubmnailUrl: string;
}

type Picture = Image;

export interface Avatar {
  picture: Picture;
}
