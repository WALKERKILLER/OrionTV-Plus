import React from "react";
import { TouchableOpacity } from "react-native";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { API } from "@/services/api";

import VideoCardMobile from "./VideoCard.mobile";
import VideoCardTablet from "./VideoCard.tablet";
import VideoCardTV from "./VideoCard.tv";

interface VideoCardProps extends React.ComponentProps<typeof TouchableOpacity> {
  id: string;
  source: string;
  title: string;
  poster: string;
  year?: string;
  rate?: string;
  sourceName?: string;
  progress?: number;
  playTime?: number;
  episodeIndex?: number;
  totalEpisodes?: number;
  onFocus?: () => void;
  onRecordDeleted?: () => void;
  api: API;
}

const VideoCardComponent = React.forwardRef<any, VideoCardProps>((props, ref) => {
  const { deviceType } = useResponsiveLayout();

  switch (deviceType) {
    case "mobile":
      return <VideoCardMobile {...props} ref={ref} />;
    case "tablet":
      return <VideoCardTablet {...props} ref={ref} />;
    case "tv":
    default:
      return <VideoCardTV {...props} ref={ref} />;
  }
});

VideoCardComponent.displayName = "VideoCard";

const VideoCard = React.memo(VideoCardComponent);

export default VideoCard;
