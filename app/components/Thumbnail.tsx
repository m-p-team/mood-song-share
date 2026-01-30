"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  videoId: string;
};

export default function Player({ videoId }: Props) {
  const [src, setSrc] = useState(
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  );

  return (
    <Image
      src={src}
      alt="thumbnail"
      width={800}
      height={450}
      onError={() =>
        setSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
      }
    />
  );
}
