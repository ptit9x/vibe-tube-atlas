// Industry taxonomy for the daily niche scan.
// 8 RPM-weighted categories × 28 industries, each with seed keywords
// in vi/en (+ ja/ko core terms where relevant).
// Imported by BOTH the web app (via @shared alias) and the daily-scan
// Edge Function — keep dependency-free.

export interface CategoryDef {
  key: string
  labelVi: string
  labelEn: string
  rpmMultiplier: number
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'finance-business', labelVi: 'Tài chính & Kinh doanh', labelEn: 'Finance & Business', rpmMultiplier: 3.0 },
  { key: 'technology', labelVi: 'Công nghệ', labelEn: 'Technology', rpmMultiplier: 2.2 },
  { key: 'health-wellness', labelVi: 'Sức khoẻ', labelEn: 'Health & Wellness', rpmMultiplier: 1.8 },
  { key: 'education-career', labelVi: 'Giáo dục & Sự nghiệp', labelEn: 'Education & Career', rpmMultiplier: 1.6 },
  { key: 'home-diy', labelVi: 'Nhà cửa & DIY', labelEn: 'Home & DIY', rpmMultiplier: 1.4 },
  { key: 'hobbies-crafts', labelVi: 'Sở thích & Thủ công', labelEn: 'Hobbies & Crafts', rpmMultiplier: 1.2 },
  { key: 'lifestyle', labelVi: 'Phong cách sống', labelEn: 'Lifestyle', rpmMultiplier: 1.1 },
  { key: 'entertainment-gaming', labelVi: 'Giải trí & Gaming', labelEn: 'Entertainment & Gaming', rpmMultiplier: 0.6 },
]

export type CategoryKey =
  | 'finance-business'
  | 'technology'
  | 'health-wellness'
  | 'education-career'
  | 'home-diy'
  | 'hobbies-crafts'
  | 'lifestyle'
  | 'entertainment-gaming'

export interface IndustrySeeds {
  key: string
  category: CategoryKey
  labelVi: string
  labelEn: string
  seeds: {
    vi: string[]
    en: string[]
    ja?: string[]
    ko?: string[]
  }
}

export const INDUSTRIES: IndustrySeeds[] = [
  // ===== finance-business (×3.0) =====
  {
    key: 'personal-finance', category: 'finance-business',
    labelVi: 'Tài chính cá nhân', labelEn: 'Personal Finance',
    seeds: {
      vi: ['tiết kiệm', 'quản lý tiền', 'thoát nợ', 'ngân sách cá nhân', 'lãi kép',
           'quỹ dự phòng', 'tài chính cho người mới', 'bảo hiểm nhân thọ', 'tích sản', 'quản lý chi tiêu'],
      en: ['budgeting', 'index funds', 'debt payoff', 'emergency fund', 'frugal living',
           'compound interest', 'net worth tracking', 'personal finance for beginners', 'retirement planning', 'credit score'],
      ja: ['家計簿', '貯金 方法', '投資 入門', '老後資金', 'iDeCo'],
      ko: ['재테크', '저축 방법', '노후 준비', '신용 점수', '월급 관리'],
    },
  },
  {
    key: 'investing-trading', category: 'finance-business',
    labelVi: 'Đầu tư & Giao dịch', labelEn: 'Investing & Trading',
    seeds: {
      vi: ['đầu tư chứng khoán', 'phân tích kỹ thuật', 'đầu tư vàng', 'chứng chỉ quỹ', 'đầu tư dài hạn',
           'sàn chứng khoán', 'coin cho người mới', 'định giá cổ phiếu', 'cảnh báo Margin', 'danh mục đầu tư'],
      en: ['stock market for beginners', 'dividend investing', 'value investing', 'technical analysis', 'etf investing',
           'options trading basics', 'real estate investing', 'portfolio diversification', 'dollar cost averaging', 'stock valuation'],
      ja: ['株 入門', '積立投資', '分配金 投資', 'テクニカル分析'],
      ko: ['주식 투자 입문', '배당주', '테크니컬 분석', '적립식 투자'],
    },
  },
  {
    key: 'real-estate', category: 'finance-business',
    labelVi: 'Bất động sản', labelEn: 'Real Estate',
    seeds: {
      vi: ['mua nhà đầu tiên', 'đầu tư bất động sản', 'thuê nhà hay mua nhà', 'căn hộ chung cư', 'đất nền',
           'phân tích bất động sản', 'vay mua nhà', 'cho thuê phòng', 'sổ hồng', 'phong thuỷ nhà ở'],
      en: ['first time home buyer', 'real estate investing', 'renting vs buying', 'house hacking', 'rental property',
           'mortgage explained', 'airbnb investment', 'property management', 'house flipping', 'real estate market analysis'],
      ja: ['不動産 投資', '住宅ローン', 'サラリーマン 不動産'],
      ko: ['부동산 투자', '청약 전략', '대출 상식'],
    },
  },
  {
    key: 'make-money-online', category: 'finance-business',
    labelVi: 'Kiếm tiền online', labelEn: 'Make Money Online',
    seeds: {
      vi: ['kiếm tiền online', 'kiếm tiền youtube', 'freelance cho người mới', 'bán hàng online', 'dạy học online',
           'affiliate marketing', 'dropshipping việt nam', 'kiếm tiền với ai', 'print on demand', 'thu nhập thụ động'],
      en: ['make money online', 'youtube monetization', 'freelancing tips', 'affiliate marketing', 'dropshipping',
           'print on demand', 'passive income ideas', 'side hustles', 'digital products', 'etsy shop'],
      ja: ['副業 おすすめ', 'せどり', 'ブログ 収益化'],
      ko: ['부업 추천', '블로그 수익화', '유튜브 수익'],
    },
  },
  {
    key: 'small-business', category: 'finance-business',
    labelVi: 'Kinh doanh nhỏ', labelEn: 'Small Business',
    seeds: {
      vi: ['khởi nghiệp', 'quyết toán thuế', 'hóa đơn điện tử', 'quản lý bán hàng', 'marketing cho quán',
           'mở quán cà phê', 'kinh doanh online', 'vốn khởi nghiệp', 'chăm sóc khách hàng', 'quản lý nhân viên'],
      en: ['small business ideas', 'llc vs sole proprietorship', 'business taxes explained', 'email marketing', 'sales funnel',
           'shopify store', 'customer retention', 'business plan', 'local seo', 'hiring first employee'],
      ja: ['個人事業 主 確定申告', 'フリーランス 始め方', '集客 方法'],
      ko: ['소자본 창업', '사업자 세금', '소상공인 마케팅'],
    },
  },

  // ===== technology (×2.2) =====
  {
    key: 'tech-review', category: 'technology',
    labelVi: 'Review công nghệ', labelEn: 'Tech Review',
    seeds: {
      vi: ['review điện thoại', 'laptop giá rẻ', 'tai nghe không dây', 'đồng hồ thông minh', 'so sánh điện thoại',
           'máy ảnh', 'router wifi', 'ssd ngoài', 'pc gaming', 'phụ kiện apple'],
      en: ['phone review', 'best budget laptop', 'wireless earbuds', 'smartwatch review', 'camera comparison',
           'mechanical keyboard', 'monitor buying guide', 'tech unboxing', 'pc build guide', 'apple accessories'],
      ja: ['スマホ レビュー', 'コスパ ノートpc', 'ワイヤレスイヤホン おすすめ', 'pc 自作'],
      ko: ['스마트폰 리뷰', '가성비 노트북', '무선 이어폰 추천', 'pc 조립'],
    },
  },
  {
    key: 'ai-tools', category: 'technology',
    labelVi: 'Công cụ AI', labelEn: 'AI Tools',
    seeds: {
      vi: ['chatgpt mẹo', 'ai tạo video', 'ai vẽ ảnh', 'tự động hoá cho người mới', 'ai viết content',
           'midjourney', 'notion ai', 'prompt chatgpt', 'ai miễn phí', 'ai agent'],
      en: ['chatgpt tips', 'ai video generator', 'midjourney tutorial', 'n8n automation', 'ai image generation',
           'prompt engineering', 'notion ai', 'free ai tools', 'ai agents', 'gemini vs chatgpt'],
      ja: ['chatgpt 使い方', 'ai 動画生成', '生成ai ツール', 'プロンプト エンジニアリング'],
      ko: ['chatgpt 사용법', 'ai 동영상 생성', '프롬프트 작성법', '무료 ai 도구'],
    },
  },
  {
    key: 'programming-dev', category: 'technology',
    labelVi: 'Lập trình', labelEn: 'Programming & Dev',
    seeds: {
      vi: ['học lập trình', 'javascript cho người mới', 'react hook', 'python tự học', 'css grid',
           'api là gì', 'database sql', 'git cho người mới', 'docker cơ bản', 'backend roadmaps'],
      en: ['learn to code', 'javascript tutorial', 'react hooks explained', 'python for beginners', 'css grid layout',
           'rest api explained', 'sql tutorial', 'git tutorial', 'docker basics', 'backend developer roadmap'],
      ja: ['プログラミング 独学', 'python 入門', 'react 入門'],
      ko: ['코딩 독학', '파이썬 입문', 'react 기초'],
    },
  },
  {
    key: 'cybersecurity', category: 'technology',
    labelVi: 'Bảo mật', labelEn: 'Cybersecurity',
    seeds: {
      vi: ['bảo mật mạng', 'mật khẩu an toàn', 'chống lừa đảo online', 'vpn có thật sự cần', 'hai lớp xác thực',
           'an toàn ngân hàng số', 'phishing là gì', 'ransomware', 'hack máy tính', 'quyền riêng tư digital'],
      en: ['cybersecurity basics', 'password manager', 'phishing protection', 'vpn explained', 'two factor authentication',
           'online privacy guide', 'home network security', 'ransomware explained', 'ethical hacking', 'data breach'],
      ja: ['サイバーセキュリティ 入門', 'フィッシング対策', 'vpn とは'],
      ko: ['개인정보 보호', '보안 입문', '피싱 예방'],
    },
  },

  // ===== health-wellness (×1.8) =====
  {
    key: 'fitness', category: 'health-wellness',
    labelVi: 'Fitness & Gym', labelEn: 'Fitness & Gym',
    seeds: {
      vi: ['tập gym cho người mới', 'giảm cân tại nhà', 'tập bụng', 'kéo giãn', 'chạy bộ cho người mới',
           'tập tạ', 'yoga sáng', 'calisthenics', 'tập cardio', 'lịch tập gym'],
      en: ['home workout', 'fat loss for beginners', 'abs workout', 'stretching routine', 'running for beginners',
           'weight training', 'morning yoga', 'calisthenics', 'hiit workout', 'gym program'],
      ja: ['自宅 筋トレ', 'ダイエット 運動', 'ストレッチ'],
      ko: ['홈트', '다이어트 운동', '스트레칭'],
    },
  },
  {
    key: 'nutrition-diet', category: 'health-wellness',
    labelVi: 'Dinh dưỡng', labelEn: 'Nutrition & Diet',
    seeds: {
      vi: ['dinh dưỡng giảm cân', 'đạm thực vật', 'đường fructose', 'thực phẩm chức năng', 'eat clean',
           'fasting 16 8', 'sữa hạt', 'vitamin d', 'thực đơn giảm cân', 'metabolism'],
      en: ['nutrition for fat loss', 'plant based protein', 'intermittent fasting', 'vitamin supplements', 'healthy meal prep',
           'sugar addiction', 'gut health', 'macro counting', 'anti inflammatory foods', 'keto diet'],
      ja: ['タンパク質 摂取', '糖質制限', '腸活'],
      ko: ['단백질 식단', '저당식', '장건강'],
    },
  },
  {
    key: 'mental-health', category: 'health-wellness',
    labelVi: 'Sức khoẻ tinh thần', labelEn: 'Mental Health',
    seeds: {
      vi: ['burnout', 'stress công sở', 'thiền mindfulness', 'ngủ ngon', 'lo âu',
           'journaling', 'tự kỷ luật', 'chữa lành', 'psychology of money', 'deep work'],
      en: ['anxiety management', 'burnout recovery', 'mindfulness meditation', 'sleep hygiene', 'stress relief',
           'journaling prompts', 'self discipline', 'emotional healing', 'mental health tips', 'deep work focus'],
      ja: ['マインドフルネス', '睡眠改善', 'ストレス解消'],
      ko: ['불안 완화', '수면 개선', '스트레스 관리'],
    },
  },

  // ===== education-career (×1.6) =====
  {
    key: 'study-languages', category: 'education-career',
    labelVi: 'Học ngoại ngữ', labelEn: 'Study & Languages',
    seeds: {
      vi: ['học tiếng anh giao tiếp', 'ielts speaking', 'toeic listening', 'học từ vựng', 'phát âm tiếng anh',
           'học tiếng nhật cho người mới', 'jlpt n5', 'học tiếng hàn', 'topik', 'shadowing tiếng anh'],
      en: ['english speaking practice', 'ielts preparation', 'learn spanish', 'language learning tips', 'vocabulary memorization',
           'japanese for beginners', 'jlpt study', 'korean learning', 'language immersion', 'anki spaced repetition'],
      ja: ['英語 学習', 'toeic 対策', '日本語 勉強'],
      ko: ['영어 회화', '토익 준비', '한국어 학습'],
    },
  },
  {
    key: 'career-skills', category: 'education-career',
    labelVi: 'Kỹ năng & Sự nghiệp', labelEn: 'Career Skills',
    seeds: {
      vi: ['viết cv', 'phỏng vấn xin việc', 'đàm phán lương', 'kỹ năng thuyết trình', 'quản lý thời gian',
           'personal branding', 'xin việc ngành it', 'chuyển ngành', 'leader quản lý team', 'excel cho công việc'],
      en: ['resume writing', 'job interview tips', 'salary negotiation', 'public speaking', 'time management',
           'personal branding', 'career change', 'people management', 'excel for work', 'productivity systems'],
      ja: ['転職 準備', '面接対策', 'プレゼン 上達'],
      ko: ['자기소개서', '면접 준비', '커리어 전환'],
    },
  },
  {
    key: 'exam-prep', category: 'education-career',
    labelVi: 'Ôn thi', labelEn: 'Exam Prep',
    seeds: {
      vi: ['ôn thi đại học', 'phương pháp ôn thi', 'tổng ôn toán', 'ôn thi ielts', 'thi thử miễn phí',
           'ôn thi công chức', 'mẹo làm bài thi', 'ôn tập hiệu quả', 'học online cho học sinh', 'tài liệu ôn thi'],
      en: ['sat preparation', 'study techniques', 'exam revision', 'gre prep', 'act practice',
           'civil service exam', 'test taking strategies', 'effective study habits', 'online study resources', 'past papers'],
      ja: ['受験勉強', '英検 対策', '資格試験'],
      ko: ['수능 준비', '공부법', '자격증 시험'],
    },
  },

  // ===== home-diy (×1.4) =====
  {
    key: 'home-improvement', category: 'home-diy',
    labelVi: 'Sửa nhà & Nội thất', labelEn: 'Home Improvement',
    seeds: {
      vi: ['sửa chữa nhà', 'trang trí phòng ngủ', 'diy đồ dùng', 'sơn tường', 'vệ sinh nhà cửa',
           'kệ gỗ tự làm', 'cách treo tranh', 'chống thấm', 'đèn nội thất', 'tổ chức không gian'],
      en: ['home improvement diy', 'bedroom makeover', 'woodworking projects', 'painting walls', 'deep cleaning',
           'shelving ideas', 'furniture restoration', 'plumbing basics', 'interior lighting', 'small space organization'],
      ja: ['diy 家具', '部屋 レイアウト', '壁紙 貼り'],
      ko: ['diy 가구', '방 꾸미기', '벽지 시공'],
    },
  },
  {
    key: 'gardening', category: 'home-diy',
    labelVi: 'Làm vườn', labelEn: 'Gardening',
    seeds: {
      vi: ['trồng rau tại nhà', 'chăm cây cảnh', 'đất trồng', 'phân bón hữu cơ', 'trồng cây trong nhà',
           'sen đá', 'bon sai', 'sâu bệnh cây', 'thủy canh', 'vườn balcony'],
      en: ['vegetable gardening', 'indoor plants', 'composting', 'organic fertilizer', 'houseplant care',
           'succulent care', 'bonsai for beginners', 'pest control garden', 'hydroponics', 'balcony garden'],
      ja: ['家庭菜園', '観葉植物', '水耕栽培'],
      ko: ['텃밭 가꾸기', '반려식물', '수경재배'],
    },
  },
  {
    key: 'car-care', category: 'home-diy',
    labelVi: 'Xe cộ', labelEn: 'Car Care',
    seeds: {
      vi: ['chăm sóc xe máy', 'độ xe', 'lá xe an toàn', 'mua xe cũ', 'bảo dưỡng ô tô',
           'lốp xe', 'đèn xe', 'mẹo tiết kiệm xăng', 'gara tại nhà', 'review xe'],
      en: ['car maintenance', 'car detailing', 'defensive driving', 'buying used car', 'diy car repair',
           'tire care', 'car lighting', 'fuel efficiency tips', 'home garage setup', 'car review'],
      ja: ['車 メンテナンス', 'カー用品 おすすめ', '燃費 改善'],
      ko: ['차 관리', '자동차 용품', '연비 개선'],
    },
  },

  // ===== hobbies-crafts (×1.2) =====
  {
    key: 'photography-video', category: 'hobbies-crafts',
    labelVi: 'Nhiếp ảnh & Quay phim', labelEn: 'Photography & Video',
    seeds: {
      vi: ['nhiếp ảnh cơ bản', 'chụp ảnh điện thoại', 'đèn studio', 'cắt video', 'màu phim',
           'lightroom', 'chụp chân dung', 'flycam', 'ống kính', 'quay vlog'],
      en: ['photography basics', 'smartphone photography', 'studio lighting', 'video editing', 'color grading',
           'lightroom tutorial', 'portrait photography', 'drone footage', 'lens guide', 'vlogging setup'],
      ja: ['カメラ 入門', '写真 現像', '動画編集'],
      ko: ['카메라 입문', '사진 보정', '영상 편집'],
    },
  },
  {
    key: 'art-drawing', category: 'hobbies-crafts',
    labelVi: 'Vẽ & Nghệ thuật', labelEn: 'Art & Drawing',
    seeds: {
      vi: ['học vẽ', 'vẽ chì', 'vẽ số', 'màu nước', 'digital art',
           'vẽ manga', 'thiết kế poster', 'calligraphy', 'vẽ chân dung', 'iprocreate'],
      en: ['learn to draw', 'pencil sketching', 'watercolor techniques', 'digital art', 'procreate tutorial',
           'manga drawing', 'poster design', 'calligraphy practice', 'portrait drawing', 'art fundamentals'],
      ja: ['イラスト 入門', '水彩画', 'デジタル画'],
      ko: ['드로잉 기초', '수채화', '디지털 아트'],
    },
  },
  {
    key: 'music-instruments', category: 'hobbies-crafts',
    labelVi: 'Nhạc cụ', labelEn: 'Music & Instruments',
    seeds: {
      vi: ['học guitar', 'piano cho người mới', 'hát karaoke hay', 'sản xuất nhạc', 'thu âm tại nhà',
           'học ukulele', 'đánh trống', 'mix nhạc', 'lý thuyết nhạc', 'cover nhạc'],
      en: ['learn guitar', 'piano for beginners', 'singing tips', 'music production', 'home recording',
           'ukulele tutorial', 'drum lessons', 'mixing music', 'music theory', 'song cover'],
      ja: ['ギター 初心者', 'ピアノ 独学', 'dtm 入門'],
      ko: ['기타 배우기', '피아노 독학', '미디 프로덕션'],
    },
  },

  // ===== lifestyle (×1.1) =====
  {
    key: 'cooking-recipes', category: 'lifestyle',
    labelVi: 'Nấu ăn', labelEn: 'Cooking & Recipes',
    seeds: {
      vi: ['món ăn đơn giản', 'nấu ăn cho người bận', 'món chay', 'làm bánh', 'cơm trưa văn phòng',
           'nước ép', 'món ăn kiêng', 'đồ ăn dặm', 'món nhậu', 'nấu ăn tiết kiệm'],
      en: ['easy recipes', 'meal prep for the week', 'vegetarian recipes', 'baking bread', 'lunch box ideas',
           'smoothie recipes', 'healthy eating', 'baby food recipes', 'dinner ideas', 'budget cooking'],
      ja: ['時短 レシピ', 'お弁当', 'パン 作り方'],
      ko: ['간단 레시피', '도시락', '베이킹'],
    },
  },
  {
    key: 'travel', category: 'lifestyle',
    labelVi: 'Du lịch', labelEn: 'Travel',
    seeds: {
      vi: ['du lịch bụi', 'cẩm nang du lịch', 'đặt vé máy bay rẻ', 'phượt', 'kinh nghiệm du lịch nhật bản',
           'du lịch hàn quốc', 'staycation', 'du lịch gia đình', 'xách ba lô', 'lên lịch trình du lịch'],
      en: ['budget travel', 'travel guide', 'cheap flights', 'backpacking', 'japan travel tips',
           'korea travel vlog', 'staycation ideas', 'family travel', 'solo travel', 'travel itinerary'],
      ja: ['旅行 プラン', '格安航空券', '一人旅'],
      ko: ['여행 계획', '저가 항공권', '혼자 여행'],
    },
  },
  {
    key: 'beauty-skincare', category: 'lifestyle',
    labelVi: 'Làm đẹp', labelEn: 'Beauty & Skincare',
    seeds: {
      vi: ['chăm sóc da', 'skincare routine', 'trị mụn', 'chống nắng', 'makeup cơ bản',
           'review mỹ phẩm', 'tóc khỏe', 'móng tay', 'da dầu', 'làm đẹp tự nhiên'],
      en: ['skincare routine', 'acne treatment', 'sunscreen guide', 'makeup for beginners', 'beauty product review',
           'hair care tips', 'nail art', 'oily skin care', 'natural beauty', 'korean skincare'],
      ja: ['スキンケア 基本', 'ニキビケア', 'ベースメイク'],
      ko: ['스킨케어', '여드름 관리', '초보 메이크업'],
    },
  },
  {
    key: 'parenting', category: 'lifestyle',
    labelVi: 'Nuôi dạy con', labelEn: 'Parenting',
    seeds: {
      vi: ['nuôi dạy con', 'con hay khóc', 'đồ chơi cho bé', 'dinh dưỡng cho trẻ', 'mẹ bầu',
           'sinh non', 'ngôn ngữ trẻ nhỏ', 'giấc ngủ của bé', 'mầm non', 'cho con học tiếng anh'],
      en: ['parenting tips', 'newborn care', 'baby toys', 'toddler nutrition', 'pregnancy tips',
           'gentle parenting', 'child development', 'baby sleep training', 'montessori at home', 'kids activities'],
      ja: ['子育て', '育児グッズ', '幼児教育'],
      ko: ['육아', '신생아 관리', '유아 교육'],
    },
  },
  {
    key: 'pets', category: 'lifestyle',
    labelVi: 'Thú cưng', labelEn: 'Pets',
    seeds: {
      vi: ['chăm sóc chó', 'chăm sóc mèo', 'dạy chó', 'thức ăn cho mèo', 'vaccin cho chó',
           'chó poodle', 'mèo anh lông ngắn', 'bệnh ở chó', 'cá cảnh', 'hamster'],
      en: ['dog care', 'cat care', 'dog training', 'cat food guide', 'pet vaccination',
           'poodle grooming', 'british shorthair', 'common dog illnesses', 'aquarium fish', 'hamster care'],
      ja: ['犬のしつけ', '猫 飼い方', 'ペットフード'],
      ko: ['강아지 훈련', '고양이 돌봄', '반려동물 사료'],
    },
  },

  // ===== entertainment-gaming (×0.6) =====
  {
    key: 'gaming', category: 'entertainment-gaming',
    labelVi: 'Gaming', labelEn: 'Gaming',
    seeds: {
      vi: ['game mobile hay', 'tăng rank', 'build đồ', 'review game', 'cày coin game',
           'lmht', 'valorant', 'genshin impact', 'game offline', 'mẹo chơi game'],
      en: ['mobile gaming', 'rank up tips', 'build guides', 'game review', 'farming currency',
           'league of legends', 'valorant tips', 'genshin impact guide', 'single player games', 'gaming tips'],
      ja: ['スマホゲーム おすすめ', 'ランキング攻略', 'ゲーム実況'],
      ko: ['모바일 게임', '랭크 올리기', '게임 공략'],
    },
  },
  {
    key: 'anime-movies', category: 'entertainment-gaming',
    labelVi: 'Anime & Phim', labelEn: 'Anime & Movies',
    seeds: {
      vi: ['anime hay', 'review phim', 'phim hàn', 'phim netflix', 'top anime',
           'one piece review', 'giải thích anime', 'phim kinh dị', 'phim việt nam', 'phim cổ trang'],
      en: ['best anime', 'movie review', 'kdrama review', 'netflix recommendations', 'top anime list',
           'one piece analysis', 'anime explained', 'horror movies', 'film analysis', 'period dramas'],
      ja: ['アニメ おすすめ', '映画 レビュー', 'ドラマ 感想'],
      ko: ['애니 추천', '영화 리뷰', '드라마 추천'],
    },
  },
]

// Modifier prefixes appended before seeds when expanding via Google Suggest.
// Only the first 4 prefixes per language are used per scan to bound cost.
export const MODIFIER_PREFIXES_VI = ['cách', 'tại sao', 'review', 'hướng dẫn', 'cho người mới', 'mẹo']
export const MODIFIER_PREFIXES_EN = ['how to', 'why', 'review', 'tutorial', 'for beginners', 'tips']
export const MODIFIER_PREFIXES_JA = ['やり方', 'おすすめ', '初心者', '比較', '方法']
export const MODIFIER_PREFIXES_KO = ['방법', '추천', '초보', '비교', '후기']

export function industryByKey(key: string): IndustrySeeds | undefined {
  return INDUSTRIES.find((i) => i.key === key)
}

export function categoryByKey(key: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.key === key)
}
