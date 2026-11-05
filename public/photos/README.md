# 📸 웨딩 갤러리 사진 폴더 (`public/photos/`)

추후 웨딩 촬영 사진이 준비되면 이 폴더(`public/photos/`)에 이미지 파일을 넣고,
[`src/data/wedding.json`](../../src/data/wedding.json)의 `gallery` 배열에서 `imageUrl`을 아래와 같이 지정하면 됩니다.

## 사용 예시
1. 사진 파일을 `public/photos/` 안에 넣습니다:
   - `public/photos/01.jpg`
   - `public/photos/02.jpg`
   - `public/photos/03.jpg`
2. `src/data/wedding.json`의 `gallery` 항목을 수정합니다:
   ```json
   "gallery": [
     {
       "id": "photo-1",
       "title": "벚꽃이 흩날리던 봄날의 오후",
       "subtitle": "Spring · 첫 번째 웨딩 스냅",
       "seasonTag": "SPRING GARDEN",
       "questExp": "2027. 03",
       "imageUrl": "./photos/01.jpg",
       "pixelTheme": "cherry_blossom",
       "description": "따스한 봄바람에 꽃잎이 흩날리던 정원에서 두 사람의 설레는 미소를 담았습니다.",
       "initialLikes": 48
     }
   ]
   ```
3. 첫 번째 항목(`gallery[0]`)의 `imageUrl`은 커버 화면 및 클래식 청첩장 상단의 **[웨딩 포토]** 탭 대표 사진으로도 자동 사용됩니다.
