import { NextResponse } from 'next/server';

export async function GET() {
    const data = {
  "username": "istanbulportrait",
  "biography": "Most popular photographer in Istanbul 📸 Elegant shoots for couples & travelers ✨ Book your experience now ⬇️",
  "profilePictureUrl": "https://cdn2.behold.pictures/LrQ6t6A9X0U1KIpiAdvnUvgq0Xl1/17841405940949698/profile.webp",
  "website": "https://istanbulportrait.com/",
  "followersCount": 17874,
  "followsCount": 751,
  "posts": [
    {
      "id": "18078029870522521",
      "timestamp": "2026-01-10T12:32:41+0000",
      "permalink": "https://www.instagram.com/p/DTVI3M0DF-4/",
      "mediaType": "CAROUSEL_ALBUM",
      "mediaUrl": "https://scontent-sof1-2.cdninstagram.com/v/t51.82787-15/612418693_18389034508198032_8313666643245734577_n.jpg",
      "sizes": {
        "large": {
          "mediaUrl": "https://behold.pictures/LrQ6t6A9X0U1KIpiAdvnUvgq0Xl1/NkfbcFxwKo03PKiG46P2/18078029870522521/large.jpg"
        }
      },
      "caption": "Golden hour moments in Istanbul with the lovely Bud. 🏛️✨"
    },
    {
      "id": "17973999422970212",
      "timestamp": "2025-12-26T13:05:03+0000",
      "permalink": "https://www.instagram.com/p/DSukpKvDKVk/",
      "mediaType": "CAROUSEL_ALBUM",
      "mediaUrl": "https://scontent-sof1-2.cdninstagram.com/v/t51.82787-15/606150006_18387313309198032_2625556322326626425_n.jpg",
      "sizes": {
        "large": {
          "mediaUrl": "https://behold.pictures/LrQ6t6A9X0U1KIpiAdvnUvgq0Xl1/NkfbcFxwKo03PKiG46P2/17973999422970212/large.jpg"
        }
      },
      "caption": "Сказка над крышами Стамбула для прекрасной Ольги Викторовны. ✨🇹🇷"
    },
    {
      "id": "17920810347214273",
      "timestamp": "2025-12-25T12:50:23+0000",
      "permalink": "https://www.instagram.com/p/DSr-K7ADPxD/",
      "mediaType": "CAROUSEL_ALBUM",
      "mediaUrl": "https://scontent-sof1-1.cdninstagram.com/v/t51.82787-15/605544137_18387194548198032_2063363170732048257_n.jpg",
      "sizes": {
        "large": {
          "mediaUrl": "https://behold.pictures/LrQ6t6A9X0U1KIpiAdvnUvgq0Xl1/NkfbcFxwKo03PKiG46P2/17920810347214273/large.jpg"
        }
      },
      "caption": "Capturing the soul of the city with Sandor Orbay. 🇹🇷✨"
    },
    {
      "id": "18048564470413537",
      "timestamp": "2025-11-24T15:11:50+0000",
      "permalink": "https://www.instagram.com/p/DRcZt0ljPRK/",
      "mediaType": "CAROUSEL_ALBUM",
      "mediaUrl": "https://scontent-sof1-2.cdninstagram.com/v/t51.82787-15/587526333_18383759665198032_9214159602916824587_n.jpg",
      "sizes": {
        "large": {
          "mediaUrl": "https://behold.pictures/LrQ6t6A9X0U1KIpiAdvnUvgq0Xl1/NkfbcFxwKo03PKiG46P2/18048564470413537/large.jpg"
        }
      },
      "caption": "Planning your family trip to Istanbul? Make it unforgettable 📸💙"
    },
    {
      "id": "18063837872175460",
      "timestamp": "2025-11-18T07:30:42+0000",
      "permalink": "https://www.instagram.com/p/DRMILHhjFlb/",
      "mediaType": "CAROUSEL_ALBUM",
      "mediaUrl": "https://scontent-sof1-1.cdninstagram.com/v/t51.82787-15/583630568_18379856974198032_3384009942058163807_n.jpg",
      "sizes": {
        "large": {
          "mediaUrl": "https://behold.pictures/LrQ6t6A9X0U1KIpiAdvnUvgq0Xl1/NkfbcFxwKo03PKiG46P2/18063837872175460/large.jpg"
        }
      },
      "caption": "Planning your family trip to Istanbul? Make it unforgettable with a professional family photoshoot 📸💙"
    },
    {
      "id": "18167349244376625",
      "timestamp": "2025-11-14T09:13:28+0000",
      "permalink": "https://www.instagram.com/p/DRCAwSTDG34/",
      "mediaType": "CAROUSEL_ALBUM",
      "mediaUrl": "https://scontent-sof1-1.cdninstagram.com/v/t51.82787-15/581453637_18379452907198032_213151334450708226_n.jpg",
      "sizes": {
        "large": {
          "mediaUrl": "https://behold.pictures/LrQ6t6A9X0U1KIpiAdvnUvgq0Xl1/NkfbcFxwKo03PKiG46P2/18167349244376625/large.jpg"
        }
      },
      "caption": "Estambul desde Süleymaniye se siente aún más mágico en pareja."
    }
  ]
}
    return NextResponse.json(data);
}
