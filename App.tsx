import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Camera,
  Check,
  Cloud,
  CloudRain,
  Heart,
  Home,
  MapPin,
  RefreshCw,
  Shirt,
  Sparkles,
  Sun,
  Upload,
  Archive,
  Download,
  Share2,
  Bookmark,
} from "lucide-react";

type Screen = "home" | "analysis" | "recommend" | "inspiration" | "closet" | "photo";
type BodyType = "pear" | "inverted" | "hourglass" | "rectangle" | "apple" | "banana";
type Gender = "female" | "male";
type KeypointId =
  | "headTop"
  | "chin"
  | "leftShoulder"
  | "rightShoulder"
  | "leftElbow"
  | "rightElbow"
  | "leftWaist"
  | "rightWaist"
  | "leftHip"
  | "rightHip"
  | "leftKnee"
  | "rightKnee"
  | "leftAnkle"
  | "rightAnkle";

type Point = { x: number; y: number };
type Points = Partial<Record<KeypointId, Point>>;

type Ratios = {
  headBody: number;
  shoulderHead: number;
  waistShoulder: number;
  shoulderHip: number;
  legBody: number;
  torsoLength: number;
  kneeHeight: number;
  waistHip: number;
  armLength: number;
  shoulderWidth: number;
};

type Weather = {
  city: string;
  temp: number;
  text: string;
  humidity: number;
  wind: number;
  source: "live" | "demo";
};

const keypoints: { id: KeypointId; label: string; color: string }[] = [
  { id: "headTop", label: "头顶", color: "#ef4444" },
  { id: "chin", label: "下巴", color: "#f97316" },
  { id: "leftShoulder", label: "左肩", color: "#2563eb" },
  { id: "rightShoulder", label: "右肩", color: "#2563eb" },
  { id: "leftElbow", label: "左手肘", color: "#3b82f6" },
  { id: "rightElbow", label: "右手肘", color: "#3b82f6" },
  { id: "leftWaist", label: "左腰", color: "#9333ea" },
  { id: "rightWaist", label: "右腰", color: "#9333ea" },
  { id: "leftHip", label: "左胯", color: "#16a34a" },
  { id: "rightHip", label: "右胯", color: "#16a34a" },
  { id: "leftKnee", label: "左膝", color: "#f59e0b" },
  { id: "rightKnee", label: "右膝", color: "#f59e0b" },
  { id: "leftAnkle", label: "左脚踝", color: "#db2777" },
  { id: "rightAnkle", label: "右脚踝", color: "#db2777" },
];

const skeleton: [KeypointId, KeypointId][] = [
  ["headTop", "chin"],
  ["leftShoulder", "rightShoulder"],
  ["leftShoulder", "leftElbow"],
  ["rightShoulder", "rightElbow"],
  ["leftShoulder", "leftWaist"],
  ["rightShoulder", "rightWaist"],
  ["leftWaist", "rightWaist"],
  ["leftWaist", "leftHip"],
  ["rightWaist", "rightHip"],
  ["leftHip", "rightHip"],
  ["leftHip", "leftKnee"],
  ["rightHip", "rightKnee"],
  ["leftKnee", "leftAnkle"],
  ["rightKnee", "rightAnkle"],
];

const demoPoints: Record<KeypointId, Point> = {
  headTop: { x: 0.5, y: 0.05 },
  chin: { x: 0.5, y: 0.14 },
  leftShoulder: { x: 0.34, y: 0.27 },
  rightShoulder: { x: 0.66, y: 0.27 },
  leftElbow: { x: 0.22, y: 0.38 },
  rightElbow: { x: 0.78, y: 0.38 },
  leftWaist: { x: 0.39, y: 0.48 },
  rightWaist: { x: 0.61, y: 0.48 },
  leftHip: { x: 0.35, y: 0.6 },
  rightHip: { x: 0.65, y: 0.6 },
  leftKnee: { x: 0.42, y: 0.78 },
  rightKnee: { x: 0.58, y: 0.78 },
  leftAnkle: { x: 0.42, y: 0.94 },
  rightAnkle: { x: 0.58, y: 0.94 },
};

const bodyMeta: Record<BodyType, { name: string; summary: string; focus: string; color: string; tips: string[]; strengths: string[]; avoid: string[]; necklines: string[]; pants: string[]; skirts: string[]; maleTips?: string[]; maleStrengths?: string[]; maleAvoid?: string[]; maleTops?: string[]; malePants?: string[] }> = {
  pear: {
    name: "梨形身材",
    summary: "胯部略宽于肩部，下半身存在感更强。",
    focus: "扩大肩颈视觉、收窄下装量感、强调高腰线。",
    color: "#f97316",
    tips: ["选择泡泡袖、方领、短外套增强上半身", "下装优先深色直筒裤、A 字裙", "避免低腰和胯部强装饰"],
    strengths: ["腿部线条优美", "臀部曲线圆润", "腰肢相对纤细"],
    avoid: ["低腰裤", "紧身牛仔裤", "胯部有大口袋或装饰的裤子", "蓬蓬裙"],
    necklines: ["方领", "一字肩", "宽领口", "泡泡袖"],
    pants: ["高腰直筒裤", "烟管裤", "阔腿裤", "锥形裤"],
    skirts: ["A字裙", "高腰伞裙", "直筒半身裙"],
    maleTips: ["选择肩部有设计感的上衣", "深色裤装显瘦", "避免紧身裤"],
    maleStrengths: ["肩部较窄", "下半身较稳", "适合商务装"],
    maleAvoid: ["紧身上衣", "浅色裤子", "横条纹"],
    maleTops: ["泡泡袖衬衫", "宽肩外套", "图案T恤"],
    malePants: ["深色直筒裤", "阔腿裤", "工装裤"],
  },
  inverted: {
    name: "倒三角身材",
    summary: "肩部宽于胯部，上半身轮廓更明显。",
    focus: "弱化肩宽、增加下半身量感，让比例更平衡。",
    color: "#0ea5e9",
    tips: ["上衣选择 V 领、顺色、垂坠面料", "下装适合阔腿裤、伞裙、浅色裤装", "减少垫肩、横条纹和大肩章"],
    strengths: ["肩颈线条优美", "锁骨明显", "上半身挺拔"],
    avoid: ["垫肩外套", "横条纹上衣", "一字肩上衣", "泡泡袖"],
    necklines: ["V领", "圆领", "窄领口", "斜肩"],
    pants: ["阔腿裤", "直筒裤", "浅色裤", "印花裤"],
    skirts: ["A字裙", "伞裙", "百褶裙", "阔摆裙"],
    maleTips: ["选择深色上衣", "下身可选浅色或亮色", "避免肩部装饰"],
    maleStrengths: ["肩部宽阔", "气场强", "穿西装特别帅"],
    maleAvoid: ["垫肩西装", "横条纹", "肩章外套"],
    maleTops: ["V领针织衫", "深色T恤", "素色衬衫"],
    malePants: ["浅色休闲裤", "卡其裤", "白色牛仔裤"],
  },
  hourglass: {
    name: "沙漏型身材",
    summary: "肩胯接近，腰部收窄明显，曲线感较强。",
    focus: "保留腰线优势，避免过度宽松遮住比例。",
    color: "#d946ef",
    tips: ["收腰连衣裙、腰带、西装裙很适合", "高腰下装可以继续强化腿长", "避免全身无腰线的廓形"],
    strengths: ["曲线优美", "身材匀称", "穿收腰服装特别好看"],
    avoid: ["oversized上衣", "宽松直筒裙", "无腰线连衣裙", "全身同色无层次"],
    necklines: ["V领", "方领", "心形领", "一字肩"],
    pants: ["高腰裤", "紧身裤", "阔腿裤", "喇叭裤"],
    skirts: ["收腰连衣裙", "包臀裙", "高腰A字裙", "鱼尾裙"],
    maleTips: ["选择修身剪裁", "避免过于宽松", "强调肩线"],
    maleStrengths: ["肩胯比例好", "穿西装很有型", "身材匀称"],
    maleAvoid: ["过于宽松的衣服", "无结构的上衣"],
    maleTops: ["修身西装", "Polo衫", "收腰夹克"],
    malePants: ["直筒西裤", "修身牛仔裤", "锥形裤"],
  },
  rectangle: {
    name: "H 型身材",
    summary: "肩、腰、胯差异较小，整体线条利落修长。",
    focus: "制造腰线和层次，增加曲线变化。",
    color: "#10b981",
    tips: ["短上衣加高腰裤能分割比例", "荷叶边、褶皱、叠穿增加层次", "用腰带或撞色拼接制造腰线"],
    strengths: ["身材修长", "可塑性强", "穿西装特别好看"],
    avoid: ["全身宽松无腰线", "超长款上衣", "直筒无收腰连衣裙"],
    necklines: ["V领", "方领", "高领", "一字肩"],
    pants: ["高腰裤", "阔腿裤", "锥形裤", "工装裤"],
    skirts: ["高腰A字裙", "百褶裙", "不规则裙", "收腰半身裙"],
    maleTips: ["用层次感制造曲线", "腰带可以强调腰线", "剪裁利落的衣服很适合"],
    maleStrengths: ["身材高挑", "比例均匀", "适合各种风格"],
    maleAvoid: ["全身同色", "过于宽松"],
    maleTops: ["层次感衬衫", "短夹克", "有结构的西装"],
    malePants: ["高腰工装裤", "直筒牛仔裤", "锥形西裤"],
  },
  apple: {
    name: "苹果型身材",
    summary: "上半身偏圆润，腰部有肉感，下半身相对纤细。",
    focus: "突出腿部优势，修饰上半身轮廓。",
    color: "#f59e0b",
    tips: ["V领和U领拉长颈部线条", "深色上衣收缩上半身", "高腰下装突出腿部"],
    strengths: ["腿部纤细", "手臂相对匀称", "适合穿裙子"],
    avoid: ["高领上衣", "横条纹", "腰部有装饰的款式", "蓬蓬裙"],
    necklines: ["V领", "U领", "大圆领", "斜肩"],
    pants: ["高腰裤", "A字裙", "百褶裙", "阔腿裤"],
    skirts: ["A字短裙", "高腰伞裙", "铅笔裙"],
    maleTips: ["选择深色上衣", "避免横条纹", "多穿V领"],
    maleStrengths: ["下半身相对瘦", "腿部线条好"],
    maleAvoid: ["紧身T恤", "横条纹", "高领"],
    maleTops: ["深色V领T恤", "宽松衬衫", "开衫"],
    malePants: ["浅色休闲裤", "卡其裤", "直筒牛仔裤"],
  },
  banana: {
    name: "香蕉型身材",
    summary: "身材纤细，肩、腰、胯线条平直，曲线感较弱。",
    focus: "通过服装创造曲线，增加层次和立体感。",
    color: "#8b5cf6",
    tips: ["荷叶边、褶皱增加曲线", "收腰设计制造腰线", "叠穿和配饰增加层次"],
    strengths: ["身材纤细", "穿什么都好看", "适合各种风格"],
    avoid: ["完全直筒的款式", "没有腰线的连衣裙", "过于宽松的衣服"],
    necklines: ["有设计感的领口", "泡泡袖", "飘带"],
    pants: ["高腰裤", "阔腿裤", "喇叭裤"],
    skirts: ["A字裙", "百褶裙", "鱼尾裙"],
    maleTips: ["选择有结构的衣服", "可以用配饰增加层次", "避免过于紧身"],
    maleStrengths: ["身材瘦长", "穿什么都好看"],
    maleAvoid: ["完全紧身", "没有结构的衣服"],
    maleTops: ["层次感衬衫", "有设计感的外套", "Polo衫"],
    malePants: ["直筒裤", "锥形裤", "工装裤"],
  },
};

const outfitBase = [
  {
    id: "work-soft",
    name: "通勤柔雾套装",
    tags: ["通勤", "约会", "简约", "温柔"],
    body: ["pear", "hourglass"] as BodyType[],
    weather: "22-28°C",
    pieces: ["米白衬衫", "高腰直筒裙", "细腰带", "乐福鞋"],
    reason: "高腰线拉长腿部，浅色上衣把视觉重心提到肩颈。",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&auto=format&fit=crop",
  },
  {
    id: "city-balance",
    name: "城市平衡感穿搭",
    tags: ["日常", "通勤", "简约", "休闲"],
    body: ["inverted", "rectangle"] as BodyType[],
    weather: "18-26°C",
    pieces: ["V 领针织衫", "浅色阔腿裤", "低饱和托特包", "小白鞋"],
    reason: "V 领收窄肩部视觉，阔腿裤给下半身补足量感。",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop",
  },
  {
    id: "weekend-a",
    name: "周末松弛 A 字线",
    tags: ["休闲", "旅行", "甜美", "日系"],
    body: ["pear", "rectangle", "hourglass"] as BodyType[],
    weather: "24-32°C",
    pieces: ["短款开衫", "A 字半裙", "草编包", "凉鞋"],
    reason: "A 字下摆顺着胯部展开，短款上衣自然提高腰线。",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&auto=format&fit=crop",
  },
  {
    id: "rain-light",
    name: "小雨轻机能搭配",
    tags: ["雨天", "通勤", "机能", "街头"],
    body: ["pear", "inverted", "hourglass", "rectangle"] as BodyType[],
    weather: "16-24°C",
    pieces: ["防泼水短风衣", "九分裤", "防滑鞋", "轻量斜挎包"],
    reason: "短风衣不压身高，防泼水面料适合天气变化。",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop",
  },
  {
    id: "pear-enhance",
    name: "梨形扬长套装",
    tags: ["日常", "约会", "甜美", "温柔"],
    body: ["pear"] as BodyType[],
    weather: "20-28°C",
    pieces: ["泡泡袖上衣", "高腰烟管裤", "锁骨链", "尖头鞋"],
    reason: "泡泡袖增加上半身量感，烟管裤修饰腿型，尖头鞋延伸腿部线条。",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=900&auto=format&fit=crop",
  },
  {
    id: "inverted-balance",
    name: "倒三角平衡搭配",
    tags: ["通勤", "正式", "简约", "法式"],
    body: ["inverted"] as BodyType[],
    weather: "18-25°C",
    pieces: ["垂坠感衬衫", "A 字半身裙", "细跟鞋", "腋下包"],
    reason: "垂坠面料弱化肩宽，A字裙增加下半身量感，整体比例更和谐。",
    image: "https://images.unsplash.com/photo-1556740755-069a40165b40?w=900&auto=format&fit=crop",
  },
  {
    id: "hourglass-highlight",
    name: "沙漏曲线套装",
    tags: ["约会", "正式", "复古", "甜美"],
    body: ["hourglass"] as BodyType[],
    weather: "22-30°C",
    pieces: ["收腰连衣裙", "细腰带", "高跟鞋", "手拿包"],
    reason: "收腰设计凸显腰线优势，高跟鞋拉长腿部，整体优雅精致。",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=900&auto=format&fit=crop",
  },
  {
    id: "rectangle-create",
    name: "H型比例重塑",
    tags: ["休闲", "旅行", "街头", "日系"],
    body: ["rectangle"] as BodyType[],
    weather: "24-32°C",
    pieces: ["短款卫衣", "高腰阔腿裤", "宽腰带", "帆布鞋"],
    reason: "短款上衣+高腰裤分割身材比例，宽腰带制造腰线，增加层次感。",
    image: "https://images.unsplash.com/photo-1517457154238-47a211488fc8?w=900&auto=format&fit=crop",
  },
  {
    id: "sporty-casual",
    name: "运动休闲风",
    tags: ["运动", "日常", "街头", "休闲"],
    body: ["pear", "inverted", "hourglass", "rectangle"] as BodyType[],
    weather: "16-24°C",
    pieces: ["宽松卫衣", "紧身运动裤", "运动鞋", "棒球帽"],
    reason: "上宽下紧搭配平衡比例，舒适又时尚。",
    image: "https://images.unsplash.com/photo-1526336024174-d53119c7a157?w=900&auto=format&fit=crop",
  },
  {
    id: "vintage-chic",
    name: "复古优雅风",
    tags: ["约会", "正式", "复古", "法式"],
    body: ["hourglass", "rectangle"] as BodyType[],
    weather: "18-26°C",
    pieces: ["复古格纹西装", "高腰A字裙", "玛丽珍鞋", "珍珠耳环"],
    reason: "复古西装挺括肩部，A字裙修饰下半身，经典永不过时。",
    image: "https://images.unsplash.com/photo-1551524438-a03a13185052?w=900&auto=format&fit=crop",
  },
  {
    id: "french-lazy",
    name: "法式慵懒风",
    tags: ["日常", "约会", "法式", "休闲"],
    body: ["pear", "hourglass", "rectangle"] as BodyType[],
    weather: "20-28°C",
    pieces: ["条纹针织衫", "高腰牛仔裤", "草编包", "乐福鞋"],
    reason: "经典条纹衫搭配高腰裤， effortless chic 法式慵懒感。",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop",
  },
  {
    id: "japanese-mori",
    name: "日系森系穿搭",
    tags: ["日常", "旅行", "日系", "甜美"],
    body: ["pear", "rectangle", "inverted"] as BodyType[],
    weather: "22-30°C",
    pieces: ["棉麻衬衫", "百褶长裙", "针织开衫", "帆布鞋"],
    reason: "清新自然的棉麻材质，温柔治愈的森系风格。",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&auto=format&fit=crop",
  },
  {
    id: "street-sweet",
    name: "甜酷少女风",
    tags: ["日常", "约会", "街头", "甜美"],
    body: ["hourglass", "rectangle", "pear"] as BodyType[],
    weather: "20-28°C",
    pieces: ["oversize卫衣", "百褶短裙", "马丁靴", "棒球帽"],
    reason: "甜美中带点酷飒，个性十足的甜酷风格。",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&auto=format&fit=crop",
  },
  {
    id: "minimal-office",
    name: "极简通勤风",
    tags: ["通勤", "正式", "简约"],
    body: ["inverted", "rectangle", "hourglass"] as BodyType[],
    weather: "18-26°C",
    pieces: ["白衬衫", "西装裤", "乐福鞋", "托特包"],
    reason: "less is more，高级感满分的极简通勤穿搭。",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&auto=format&fit=crop",
  },
  {
    id: "gentle-style",
    name: "温柔风连衣裙",
    tags: ["约会", "日常", "温柔", "甜美"],
    body: ["pear", "hourglass", "rectangle"] as BodyType[],
    weather: "22-32°C",
    pieces: ["碎花连衣裙", "针织开衫", "玛丽珍鞋", "珍珠发夹"],
    reason: "温柔风连衣裙，约会必备，气质拉满。",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&auto=format&fit=crop",
  },
];

const inspirationLooks = [
  {
    id: "look-1",
    title: "法式慵懒风",
    style: "法式",
    description: " effortless chic，随性中透着精致",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop",
    likes: 328,
    tags: ["条纹衫", "阔腿裤", "草编包"],
    top: { name: "蓝白条纹衬衫", color: "#3b82f6" },
    bottom: { name: "白色阔腿裤", color: "#ffffff" },
    shoes: { name: "米色穆勒鞋", color: "#d4a574" },
  },
  {
    id: "look-2",
    title: "极简通勤",
    style: "简约",
    description: "less is more，高级感满分",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop",
    likes: 256,
    tags: ["白衬衫", "西装裤", "乐福鞋"],
    top: { name: "白色商务衬衫", color: "#ffffff" },
    bottom: { name: "黑色西装裤", color: "#111827" },
    shoes: { name: "黑色乐福鞋", color: "#111827" },
  },
  {
    id: "look-3",
    title: "甜酷少女",
    style: "街头",
    description: "甜美中带点酷飒，个性十足",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop",
    likes: 412,
    tags: ["oversize", "短裙", "马丁靴"],
    top: { name: "黑色oversize卫衣", color: "#1a1a1a" },
    bottom: { name: "粉色A字短裙", color: "#f472b6" },
    shoes: { name: "黑色马丁靴", color: "#1a1a1a" },
  },
  {
    id: "look-4",
    title: "日系森系",
    style: "日系",
    description: "清新自然，温柔治愈系",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop",
    likes: 189,
    tags: ["棉麻", "长裙", "针织开衫"],
    top: { name: "米色棉麻衬衫", color: "#faf0e6" },
    bottom: { name: "米粉色百褶长裙", color: "#fce7f3" },
    shoes: { name: "米色帆布板鞋", color: "#faf0e6" },
  },
  {
    id: "look-5",
    title: "复古港风",
    style: "复古",
    description: "梦回90年代，风情万种",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop",
    likes: 367,
    tags: ["碎花裙", "波浪卷", "红唇"],
    top: { name: "墨绿色丝绒外套", color: "#064e3b" },
    bottom: { name: "酒红色碎花长裙", color: "#881337" },
    shoes: { name: "酒红色乐福鞋", color: "#881337" },
  },
  {
    id: "look-6",
    title: "运动街头",
    style: "街头",
    description: "舒适又有态度，潮人必备",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop",
    likes: 298,
    tags: ["卫衣", "运动裤", "老爹鞋"],
    top: { name: "灰色圆领卫衣", color: "#6b7280" },
    bottom: { name: "黑色工装裤", color: "#1a1a1a" },
    shoes: { name: "白色老爹鞋", color: "#ffffff" },
  },
];

function ClothingItemIllustration({
  category,
  name,
  color,
  size = 120,
}: {
  category: string;
  name: string;
  color: string;
  size?: number;
}) {
  const s = size;
  const bg = "#f8fafc";
  const shadow = "rgba(0,0,0,0.1)";

  const getShade = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * percent)));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + Math.round(255 * percent)));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + Math.round(255 * percent)));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const isDark = (hex: string) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = num >> 16;
    const g = (num >> 8) & 0x00ff;
    const b = num & 0x0000ff;
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  const renderTop = () => {
    const n = name;
    const c = color;
    const dark = isDark(c);
    const lightC = getShade(c, 0.15);
    const darkC = getShade(c, -0.15);

    if (n.includes("T恤") || n.includes("打底")) {
      return (
        <>
          <path
            d={`M${s * 0.25} ${s * 0.25} L${s * 0.38} ${s * 0.18} Q${s * 0.5} ${s * 0.28} ${s * 0.62} ${s * 0.18} L${s * 0.75} ${s * 0.25} L${s * 0.68} ${s * 0.4} L${s * 0.62} ${s * 0.35} L${s * 0.62} ${s * 0.82} L${s * 0.38} ${s * 0.82} L${s * 0.38} ${s * 0.35} L${s * 0.32} ${s * 0.4} Z`}
            fill={c}
          />
          <path
            d={`M${s * 0.42} ${s * 0.22} Q${s * 0.5} ${s * 0.3} ${s * 0.58} ${s * 0.22}`}
            fill="none"
            stroke={darkC}
            strokeWidth="1.5"
          />
          <ellipse cx={s * 0.5} cy={s * 0.24} rx={s * 0.06} ry={s * 0.03} fill={dark ? "#1e293b" : "#ffffff"} opacity="0.3" />
        </>
      );
    }

    if (n.includes("衬衫") || n.includes("衬衣")) {
      return (
        <>
          <path
            d={`M${s * 0.22} ${s * 0.22} L${s * 0.38} ${s * 0.15} L${s * 0.44} ${s * 0.2} L${s * 0.56} ${s * 0.2} L${s * 0.62} ${s * 0.15} L${s * 0.78} ${s * 0.22} L${s * 0.7} ${s * 0.42} L${s * 0.62} ${s * 0.35} L${s * 0.62} ${s * 0.85} L${s * 0.38} ${s * 0.85} L${s * 0.38} ${s * 0.35} L${s * 0.3} ${s * 0.42} Z`}
            fill={c}
          />
          <path d={`M${s * 0.44} ${s * 0.2} L${s * 0.5} ${s * 0.85} L${s * 0.56} ${s * 0.2}`} fill={lightC} opacity="0.5" />
          <path d={`M${s * 0.44} ${s * 0.2} L${s * 0.5} ${s * 0.28} L${s * 0.56} ${s * 0.2}`} fill={darkC} opacity="0.3" />
          {[0.35, 0.5, 0.65, 0.8].map((y, i) => (
            <circle key={i} cx={s * 0.5} cy={s * y} r={s * 0.015} fill={dark ? "#ffffff" : "#64748b"} opacity="0.6" />
          ))}
          {n.includes("条纹") && (
            <>
              {[0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((y, i) => (
                <line key={i} x1={s * 0.25} y1={s * y} x2={s * 0.75} y2={s * y} stroke={darkC} strokeWidth="1.5" opacity="0.4" />
              ))}
            </>
          )}
        </>
      );
    }

    if (n.includes("卫衣") || n.includes("针织") || n.includes("毛衣") || n.includes("开衫")) {
      return (
        <>
          <path
            d={`M${s * 0.2} ${s * 0.28} L${s * 0.35} ${s * 0.18} Q${s * 0.5} ${s * 0.25} ${s * 0.65} ${s * 0.18} L${s * 0.8} ${s * 0.28} L${s * 0.72} ${s * 0.45} L${s * 0.65} ${s * 0.4} L${s * 0.65} ${s * 0.85} L${s * 0.35} ${s * 0.85} L${s * 0.35} ${s * 0.4} L${s * 0.28} ${s * 0.45} Z`}
            fill={c}
          />
          <ellipse cx={s * 0.5} cy={s * 0.22} rx={s * 0.08} ry={s * 0.04} fill={darkC} opacity="0.2" />
          <path d={`M${s * 0.38} ${s * 0.25} Q${s * 0.5} ${s * 0.32} ${s * 0.62} ${s * 0.25}`} fill="none" stroke={darkC} strokeWidth="1.5" opacity="0.3" />
          {n.includes("绞花") && (
            <>
              {[0.4, 0.55, 0.7].map((y, i) => (
                <path key={i} d={`M${s * 0.4} ${s * y} Q${s * 0.45} ${s * (y - 0.05)} ${s * 0.5} ${s * y} Q${s * 0.55} ${s * (y + 0.05)} ${s * 0.6} ${s * y}`} fill="none" stroke={darkC} strokeWidth="1" opacity="0.3" />
              ))}
            </>
          )}
        </>
      );
    }

    if (n.includes("西装") || n.includes("外套") || n.includes("夹克") || n.includes("工装")) {
      return (
        <>
          <path
            d={`M${s * 0.18} ${s * 0.22} L${s * 0.38} ${s * 0.14} L${s * 0.44} ${s * 0.18} L${s * 0.56} ${s * 0.18} L${s * 0.62} ${s * 0.14} L${s * 0.82} ${s * 0.22} L${s * 0.75} ${s * 0.45} L${s * 0.65} ${s * 0.38} L${s * 0.65} ${s * 0.88} L${s * 0.35} ${s * 0.88} L${s * 0.35} ${s * 0.38} L${s * 0.25} ${s * 0.45} Z`}
            fill={c}
          />
          <path d={`M${s * 0.44} ${s * 0.18} L${s * 0.38} ${s * 0.88}`} fill={darkC} opacity="0.2" />
          <path d={`M${s * 0.56} ${s * 0.18} L${s * 0.62} ${s * 0.88}`} fill={darkC} opacity="0.2" />
          <path d={`M${s * 0.44} ${s * 0.18} L${s * 0.5} ${s * 0.3} L${s * 0.56} ${s * 0.18}`} fill={lightC} opacity="0.4" />
          <rect x={s * 0.41} y={s * 0.45} width={s * 0.08} height={s * 0.12} fill="none" stroke={darkC} strokeWidth="1" opacity="0.3" />
          {n.includes("格纹") && (
            <>
              {[0.3, 0.45, 0.6, 0.75].map((y, i) => (
                <line key={`h${i}`} x1={s * 0.25} y1={s * y} x2={s * 0.75} y2={s * y} stroke={lightC} strokeWidth="1" opacity="0.4" />
              ))}
              {[0.3, 0.45, 0.6, 0.75].map((x, i) => (
                <line key={`v${i}`} x1={s * x} y1={s * 0.25} x2={s * x} y2={s * 0.85} stroke={lightC} strokeWidth="1" opacity="0.4" />
              ))}
            </>
          )}
          {n.includes("牛仔") && (
            <>
              {[0.35, 0.5, 0.65, 0.8].map((y, i) => (
                <line key={i} x1={s * 0.28} y1={s * y} x2={s * 0.72} y2={s * y} stroke={lightC} strokeWidth="0.8" opacity="0.3" />
              ))}
            </>
          )}
        </>
      );
    }

    return (
      <path
        d={`M${s * 0.25} ${s * 0.25} L${s * 0.4} ${s * 0.15} Q${s * 0.5} ${s * 0.25} ${s * 0.6} ${s * 0.15} L${s * 0.75} ${s * 0.25} L${s * 0.68} ${s * 0.42} L${s * 0.62} ${s * 0.38} L${s * 0.62} ${s * 0.82} L${s * 0.38} ${s * 0.82} L${s * 0.38} ${s * 0.38} L${s * 0.32} ${s * 0.42} Z`}
        fill={c}
      />
    );
  };

  const renderBottom = () => {
    const n = name;
    const c = color;
    const dark = isDark(c);
    const darkC = getShade(c, -0.15);
    const lightC = getShade(c, 0.1);

    if (n.includes("裙")) {
      if (n.includes("百褶")) {
        return (
          <>
            <path
              d={`M${s * 0.3} ${s * 0.18} L${s * 0.7} ${s * 0.18} L${s * 0.78} ${s * 0.85} L${s * 0.22} ${s * 0.85} Z`}
              fill={c}
            />
            {[0.35, 0.45, 0.55, 0.65, 0.75].map((x, i) => (
              <line key={i} x1={s * x} y1={s * 0.2} x2={s * (x + 0.02)} y2={s * 0.85} stroke={darkC} strokeWidth="1" opacity="0.3" />
            ))}
            <path d={`M${s * 0.3} ${s * 0.18} L${s * 0.7} ${s * 0.18}`} stroke={darkC} strokeWidth="2" />
          </>
        );
      }
      if (n.includes("A字") || n.includes("短")) {
        return (
          <>
            <path
              d={`M${s * 0.32} ${s * 0.22} L${s * 0.68} ${s * 0.22} L${s * 0.78} ${s * 0.7} L${s * 0.22} ${s * 0.7} Z`}
              fill={c}
            />
            <path d={`M${s * 0.32} ${s * 0.22} L${s * 0.68} ${s * 0.22}`} stroke={darkC} strokeWidth="2" />
            {n.includes("蕾丝") && (
              <path d={`M${s * 0.22} ${s * 0.7} Q${s * 0.35} ${s * 0.75} ${s * 0.5} ${s * 0.7} Q${s * 0.65} ${s * 0.75} ${s * 0.78} ${s * 0.7}`} fill="none" stroke={lightC} strokeWidth="2" opacity="0.6" />
            )}
          </>
        );
      }
      if (n.includes("长") || n.includes("半裙") || n.includes("丝绒")) {
        return (
          <>
            <path
              d={`M${s * 0.3} ${s * 0.15} L${s * 0.7} ${s * 0.15} L${s * 0.75} ${s * 0.88} L${s * 0.25} ${s * 0.88} Z`}
              fill={c}
            />
            <path d={`M${s * 0.3} ${s * 0.15} L${s * 0.7} ${s * 0.15}`} stroke={darkC} strokeWidth="2" />
            {n.includes("碎花") && (
              <>
                {[
                  [0.35, 0.3], [0.55, 0.35], [0.4, 0.5], [0.6, 0.55], [0.32, 0.7], [0.5, 0.75], [0.65, 0.8],
                ].map(([x, y], i) => (
                  <circle key={i} cx={s * x} cy={s * y} r={s * 0.02} fill={lightC} opacity="0.6" />
                ))}
              </>
            )}
          </>
        );
      }
      return (
        <path
          d={`M${s * 0.3} ${s * 0.2} L${s * 0.7} ${s * 0.2} L${s * 0.75} ${s * 0.8} L${s * 0.25} ${s * 0.8} Z`}
          fill={c}
        />
      );
    }

    if (n.includes("牛仔") || n.includes("裤")) {
      const isWide = n.includes("阔腿") || n.includes("直筒");
      const isSkinny = n.includes("修身") || n.includes("喇叭");
      const isShort = n.includes("短");
      const isCargo = n.includes("工装") || n.includes("束脚");

      const bottomY = isShort ? s * 0.55 : s * 0.88;
      const legWidth = isWide ? 0.18 : isSkinny ? 0.1 : 0.13;

      return (
        <>
          <path
            d={`M${s * 0.28} ${s * 0.12} L${s * 0.72} ${s * 0.12} L${s * (0.5 + legWidth + 0.02)} ${bottomY} L${s * (0.5 + 0.04)} ${s * 0.35} L${s * (0.5 - 0.04)} ${s * 0.35} L${s * (0.5 - legWidth - 0.02)} ${bottomY} Z`}
            fill={c}
          />
          <path d={`M${s * 0.28} ${s * 0.12} L${s * 0.72} ${s * 0.12}`} stroke={darkC} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.12} L${s * 0.5} ${s * 0.35}`} stroke={darkC} strokeWidth="1" opacity="0.4" />
          {n.includes("牛仔") && (
            <>
              <rect x={s * 0.38} y={s * 0.15} width={s * 0.24} height={s * 0.08} fill="none" stroke={darkC} strokeWidth="1" opacity="0.3" />
              {[0.4, 0.55, 0.7, 0.82].filter((y) => s * y < bottomY).map((y, i) => (
                <line key={i} x1={s * 0.3} y1={s * y} x2={s * 0.7} y2={s * y} stroke={lightC} strokeWidth="0.8" opacity="0.2" />
              ))}
            </>
          )}
          {isCargo && (
            <>
              <rect x={s * 0.24} y={s * 0.4} width={s * 0.06} height={s * 0.12} fill={darkC} opacity="0.3" />
              <rect x={s * 0.7} y={s * 0.4} width={s * 0.06} height={s * 0.12} fill={darkC} opacity="0.3" />
            </>
          )}
          {n.includes("格纹") && (
            <>
              {[0.3, 0.5, 0.7].filter((y) => s * y < bottomY - 10).map((y, i) => (
                <line key={`h${i}`} x1={s * 0.3} y1={s * y} x2={s * 0.7} y2={s * y} stroke={lightC} strokeWidth="1" opacity="0.4" />
              ))}
            </>
          )}
        </>
      );
    }

    return (
      <path
        d={`M${s * 0.3} ${s * 0.15} L${s * 0.7} ${s * 0.15} L${s * 0.68} ${s * 0.85} L${s * 0.32} ${s * 0.85} Z`}
        fill={c}
      />
    );
  };

  const renderShoes = () => {
    const n = name;
    const c = color;
    const dark = isDark(c);
    const darkC = getShade(c, -0.2);
    const lightC = getShade(c, 0.15);

    if (n.includes("帆布") || n.includes("板鞋") || n.includes("老爹鞋") || n.includes("运动")) {
      return (
        <>
          <path
            d={`M${s * 0.12} ${s * 0.6} Q${s * 0.2} ${s * 0.45} ${s * 0.4} ${s * 0.4} L${s * 0.7} ${s * 0.42} Q${s * 0.85} ${s * 0.48} ${s * 0.88} ${s * 0.62} L${s * 0.88} ${s * 0.75} Q${s * 0.88} ${s * 0.85} ${s * 0.78} ${s * 0.88} L${s * 0.15} ${s * 0.88} Q${s * 0.08} ${s * 0.82} ${s * 0.12} ${s * 0.72} Z`}
            fill={c}
          />
          <path
            d={`M${s * 0.12} ${s * 0.75} L${s * 0.88} ${s * 0.75}`}
            stroke={darkC}
            strokeWidth="4"
          />
          <path d={`M${s * 0.12} ${s * 0.6} Q${s * 0.2} ${s * 0.5} ${s * 0.35} ${s * 0.48}`} fill="none" stroke={darkC} strokeWidth="1.5" opacity="0.3" />
          {n.includes("帆布") && (
            <>
              {[0.5, 0.58, 0.66].map((y, i) => (
                <line key={i} x1={s * 0.3} y1={s * y} x2={s * 0.75} y2={s * y} stroke={darkC} strokeWidth="0.8" opacity="0.3" />
              ))}
            </>
          )}
          {n.includes("老爹") && (
            <path d={`M${s * 0.65} ${s * 0.42} L${s * 0.82} ${s * 0.5} L${s * 0.85} ${s * 0.72} L${s * 0.65} ${s * 0.72} Z`} fill={darkC} opacity="0.2" />
          )}
        </>
      );
    }

    if (n.includes("高跟") || n.includes("凉鞋") || n.includes("穆勒") || n.includes("奶奶鞋") || n.includes("玛丽珍") || n.includes("平底")) {
      const hasHeel = n.includes("高跟") || n.includes("小猫跟");
      return (
        <>
          <path
            d={`M${s * 0.15} ${s * 0.58} Q${s * 0.25} ${s * 0.48} ${s * 0.45} ${s * 0.46} L${s * 0.75} ${s * 0.5} Q${s * 0.85} ${s * 0.55} ${s * 0.88} ${s * 0.65} L${s * 0.88} ${s * 0.72} L${s * 0.2} ${s * 0.72}`}
            fill={c}
          />
          {hasHeel && (
            <path d={`M${s * 0.78} ${s * 0.72} L${s * 0.82} ${s * 0.88} L${s * 0.9} ${s * 0.88} L${s * 0.88} ${s * 0.72} Z`} fill={darkC} />
          )}
          {!hasHeel && (
            <path d={`M${s * 0.15} ${s * 0.72} L${s * 0.9} ${s * 0.72}`} stroke={darkC} strokeWidth="3" />
          )}
          {n.includes("玛丽珍") && (
            <path d={`M${s * 0.35} ${s * 0.46} Q${s * 0.45} ${s * 0.4} ${s * 0.55} ${s * 0.46} L${s * 0.55} ${s * 0.58} Q${s * 0.45} ${s * 0.52} ${s * 0.35} ${s * 0.58} Z`} fill={darkC} opacity="0.2" />
          )}
          {n.includes("细带") || n.includes("凉鞋") ? (
            <>
              <line x1={s * 0.3} y1={s * 0.5} x2={s * 0.6} y2={s * 0.52} stroke={darkC} strokeWidth="2" />
              <line x1={s * 0.4} y1={s * 0.46} x2={s * 0.5} y2={s * 0.62} stroke={darkC} strokeWidth="2" />
            </>
          ) : (
            <path d={`M${s * 0.2} ${s * 0.58} Q${s * 0.35} ${s * 0.5} ${s * 0.5} ${s * 0.52}`} fill="none" stroke={darkC} strokeWidth="1" opacity="0.3" />
          )}
          {n.includes("蝴蝶结") && (
            <path d={`M${s * 0.25} ${s * 0.5} L${s * 0.18} ${s * 0.45} L${s * 0.18} ${s * 0.58} L${s * 0.25} ${s * 0.55} L${s * 0.32} ${s * 0.45} L${s * 0.32} ${s * 0.58} Z`} fill={lightC} />
          )}
        </>
      );
    }

    if (n.includes("靴") || n.includes("皮鞋") || n.includes("乐福") || n.includes("商务")) {
      const isBoot = n.includes("靴");
      return (
        <>
          <path
            d={`M${s * 0.2} ${isBoot ? s * 0.2 : s * 0.5} L${s * 0.5} ${isBoot ? s * 0.2 : s * 0.48} L${s * 0.5} ${s * 0.55} L${s * 0.78} ${s * 0.58} Q${s * 0.88} ${s * 0.63} ${s * 0.9} ${s * 0.72} L${s * 0.9} ${s * 0.8} L${s * 0.15} ${s * 0.8} Q${s * 0.1} ${s * 0.72} ${s * 0.2} ${isBoot ? s * 0.65 : s * 0.58} Z`}
            fill={c}
          />
          <path d={`M${s * 0.15} ${s * 0.78} L${s * 0.9} ${s * 0.78}`} stroke={darkC} strokeWidth="4" />
          {isBoot && (
            <>
              <path d={`M${s * 0.2} ${s * 0.2} L${s * 0.5} ${s * 0.2}`} stroke={darkC} strokeWidth="2" />
              {n.includes("马丁") && (
                <>
                  {[0.3, 0.4, 0.5, 0.6].map((y, i) => (
                    <circle key={i} cx={s * 0.35} cy={s * y} r={s * 0.015} fill={dark ? "#fbbf24" : "#64748b"} opacity="0.7" />
                  ))}
                </>
              )}
              {n.includes("切尔西") && (
                <path d={`M${s * 0.48} ${s * 0.25} L${s * 0.48} ${s * 0.5}`} stroke={darkC} strokeWidth="1" opacity="0.4" />
              )}
            </>
          )}
          {n.includes("乐福") && (
            <path d={`M${s * 0.3} ${s * 0.52} Q${s * 0.45} ${s * 0.45} ${s * 0.6} ${s * 0.52}`} fill="none" stroke={darkC} strokeWidth="2" />
          )}
          {n.includes("商务") || n.includes("皮鞋") ? (
            <path d={`M${s * 0.35} ${s * 0.55} Q${s * 0.5} ${s * 0.48} ${s * 0.65} ${s * 0.55}`} fill="none" stroke={darkC} strokeWidth="1" opacity="0.4" />
          ) : null}
        </>
      );
    }

    return (
      <path
        d={`M${s * 0.15} ${s * 0.55} Q${s * 0.25} ${s * 0.45} ${s * 0.5} ${s * 0.43} L${s * 0.75} ${s * 0.48} Q${s * 0.85} ${s * 0.55} ${s * 0.88} ${s * 0.65} L${s * 0.88} ${s * 0.78} L${s * 0.15} ${s * 0.78} Q${s * 0.1} ${s * 0.7} ${s * 0.15} ${s * 0.6} Z`}
        fill={c}
      />
    );
  };

  const renderAccessory = () => {
    const n = name;
    const c = color;
    const dark = isDark(c);

    if (n.includes("项链") || n.includes("链")) {
      return (
        <>
          <path d={`M${s * 0.25} ${s * 0.25} Q${s * 0.5} ${s * 0.65} ${s * 0.75} ${s * 0.25}`} fill="none" stroke={c} strokeWidth="3" />
          <circle cx={s * 0.5} cy={s * 0.6} r={s * 0.06} fill={c} />
          <circle cx={s * 0.5} cy={s * 0.6} r={s * 0.03} fill={dark ? "#fbbf24" : "#ffffff"} opacity="0.6" />
        </>
      );
    }

    if (n.includes("耳") || n.includes("珍珠")) {
      return (
        <>
          <circle cx={s * 0.35} cy={s * 0.35} r={s * 0.08} fill={c} />
          <circle cx={s * 0.65} cy={s * 0.35} r={s * 0.08} fill={c} />
          <circle cx={s * 0.33} cy={s * 0.32} r={s * 0.025} fill={dark ? "#ffffff" : "#fef3c7"} opacity="0.6" />
          <circle cx={s * 0.63} cy={s * 0.32} r={s * 0.025} fill={dark ? "#ffffff" : "#fef3c7"} opacity="0.6" />
        </>
      );
    }

    if (n.includes("包") || n.includes(" tote") || n.includes("托特")) {
      return (
        <>
          <path
            d={`M${s * 0.2} ${s * 0.35} L${s * 0.8} ${s * 0.35} L${s * 0.78} ${s * 0.85} L${s * 0.22} ${s * 0.85} Z`}
            fill={c}
          />
          <path d={`M${s * 0.3} ${s * 0.35} Q${s * 0.35} ${s * 0.12} ${s * 0.5} ${s * 0.12} Q${s * 0.65} ${s * 0.12} ${s * 0.7} ${s * 0.35}`} fill="none" stroke={c} strokeWidth="4" />
          <rect x={s * 0.35} y={s * 0.5} width={s * 0.3} height={s * 0.15} rx="4" fill="none" stroke={dark ? "#ffffff" : "#1e293b"} strokeWidth="1" opacity="0.2" />
        </>
      );
    }

    if (n.includes("帽")) {
      if (n.includes("棒球") || n.includes("鸭舌")) {
        return (
          <>
            <path d={`M${s * 0.2} ${s * 0.45} Q${s * 0.5} ${s * 0.15} ${s * 0.8} ${s * 0.45}`} fill={c} />
            <path d={`M${s * 0.1} ${s * 0.45} L${s * 0.9} ${s * 0.45} L${s * 0.95} ${s * 0.55} L${s * 0.05} ${s * 0.55} Z`} fill={c} />
          </>
        );
      }
      if (n.includes("草编") || n.includes("太阳")) {
        return (
          <>
            <ellipse cx={s * 0.5} cy={s * 0.5} rx={s * 0.4} ry={s * 0.12} fill={c} />
            <path d={`M${s * 0.32} ${s * 0.5} Q${s * 0.5} ${s * 0.15} ${s * 0.68} ${s * 0.5}`} fill={c} />
            {[0.35, 0.42, 0.58, 0.65].map((x, i) => (
              <line key={i} x1={s * x} y1={s * 0.4} x2={s * x} y2={s * 0.6} stroke={getShade(c, -0.1)} strokeWidth="1" opacity="0.3" />
            ))}
          </>
        );
      }
    }

    if (n.includes("丝巾") || n.includes("围巾")) {
      return (
        <>
          <path d={`M${s * 0.2} ${s * 0.3} Q${s * 0.5} ${s * 0.2} ${s * 0.8} ${s * 0.3} L${s * 0.75} ${s * 0.6} Q${s * 0.5} ${s * 0.7} ${s * 0.25} ${s * 0.6} Z`} fill={c} />
          <path d={`M${s * 0.3} ${s * 0.4} L${s * 0.7} ${s * 0.4}`} stroke={getShade(c, -0.15)} strokeWidth="1" opacity="0.4" />
          <path d={`M${s * 0.35} ${s * 0.5} L${s * 0.65} ${s * 0.5}`} stroke={getShade(c, -0.15)} strokeWidth="1" opacity="0.4" />
        </>
      );
    }

    if (n.includes("手表") || n.includes("表")) {
      return (
        <>
          <circle cx={s * 0.5} cy={s * 0.5} r={s * 0.25} fill={c} />
          <circle cx={s * 0.5} cy={s * 0.5} r={s * 0.18} fill={dark ? "#1e293b" : "#ffffff"} />
          <line x1={s * 0.5} y1={s * 0.5} x2={s * 0.5} y2={s * 0.38} stroke={c} strokeWidth="2" />
          <line x1={s * 0.5} y1={s * 0.5} x2={s * 0.6} y2={s * 0.5} stroke={c} strokeWidth="2" />
          <rect x={s * 0.47} y={s * 0.2} width={s * 0.06} height={s * 0.12} fill={c} />
          <rect x={s * 0.47} y={s * 0.68} width={s * 0.06} height={s * 0.12} fill={c} />
        </>
      );
    }

    if (n.includes("腰带") || n.includes("皮带")) {
      return (
        <>
          <rect x={s * 0.1} y={s * 0.45} width={s * 0.8} height={s * 0.12} rx="6" fill={c} />
          <rect x={s * 0.65} y={s * 0.4} width={s * 0.15} height={s * 0.22} rx="4" fill={dark ? "#fbbf24" : "#94a3b8"} />
        </>
      );
    }

    return (
      <circle cx={s * 0.5} cy={s * 0.5} r={s * 0.25} fill={c} />
    );
  };

  const renderItem = () => {
    if (category === "上装") return renderTop();
    if (category === "下装") return renderBottom();
    if (category === "鞋履") return renderShoes();
    if (category === "配饰") return renderAccessory();
    return renderTop();
  };

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <defs>
        <radialGradient id={`shadow-${category}-${name}`} cx="50%" cy="90%" r="50%">
          <stop offset="0%" stopColor={shadow} stopOpacity="0.3" />
          <stop offset="100%" stopColor={shadow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={s} height={s} fill="#ffffff" />
      <ellipse cx={s * 0.5} cy={s * 0.92} rx={s * 0.35} ry={s * 0.06} fill={`url(#shadow-${category}-${name})`} />
      <g transform={`translate(0, ${s * 0.05})`}>
        {renderItem()}
      </g>
    </svg>
  );
}

function OutfitIllustration({
  topName,
  topColor,
  bottomName,
  bottomColor,
  shoeName,
  shoeColor,
  size = 200,
}: {
  topName: string;
  topColor: string;
  bottomName: string;
  bottomColor: string;
  shoeName: string;
  shoeColor: string;
  size?: number;
}) {
  const s = size;

  const getShade = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * percent)));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + Math.round(255 * percent)));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + Math.round(255 * percent)));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const isDark = (hex: string) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = num >> 16;
    const g = (num >> 8) & 0x00ff;
    const b = num & 0x0000ff;
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  const renderTopShape = (name: string, color: string, scale: number) => {
    const n = name;
    const c = color;
    const dark = isDark(c);
    const lightC = getShade(c, 0.15);
    const darkC = getShade(c, -0.15);
    const sz = s * scale;

    if (n.includes("T恤") || n.includes("打底")) {
      return (
        <path
          d={`M${sz * 0.25} ${sz * 0.25} L${sz * 0.38} ${sz * 0.18} Q${sz * 0.5} ${sz * 0.28} ${sz * 0.62} ${sz * 0.18} L${sz * 0.75} ${sz * 0.25} L${sz * 0.68} ${sz * 0.4} L${sz * 0.62} ${sz * 0.35} L${sz * 0.62} ${sz * 0.82} L${sz * 0.38} ${sz * 0.82} L${sz * 0.38} ${sz * 0.35} L${sz * 0.32} ${sz * 0.4} Z`}
          fill={c}
        />
      );
    }

    if (n.includes("衬衫") || n.includes("衬衣")) {
      return (
        <>
          <path
            d={`M${sz * 0.22} ${sz * 0.22} L${sz * 0.38} ${sz * 0.15} L${sz * 0.44} ${sz * 0.2} L${sz * 0.56} ${sz * 0.2} L${sz * 0.62} ${sz * 0.15} L${sz * 0.78} ${sz * 0.22} L${sz * 0.7} ${sz * 0.42} L${sz * 0.62} ${sz * 0.35} L${sz * 0.62} ${sz * 0.85} L${sz * 0.38} ${sz * 0.85} L${sz * 0.38} ${sz * 0.35} L${sz * 0.3} ${sz * 0.42} Z`}
            fill={c}
          />
          <path d={`M${sz * 0.44} ${sz * 0.2} L${sz * 0.5} ${sz * 0.85} L${sz * 0.56} ${sz * 0.2}`} fill={lightC} opacity="0.5" />
          {n.includes("条纹") && (
            <>
              {[0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((y, i) => (
                <line key={i} x1={sz * 0.25} y1={sz * y} x2={sz * 0.75} y2={sz * y} stroke={darkC} strokeWidth="1.5" opacity="0.4" />
              ))}
            </>
          )}
        </>
      );
    }

    if (n.includes("卫衣") || n.includes("针织") || n.includes("毛衣") || n.includes("开衫")) {
      return (
        <path
          d={`M${sz * 0.2} ${sz * 0.28} L${sz * 0.35} ${sz * 0.18} Q${sz * 0.5} ${sz * 0.25} ${sz * 0.65} ${sz * 0.18} L${sz * 0.8} ${sz * 0.28} L${sz * 0.72} ${sz * 0.45} L${sz * 0.65} ${sz * 0.4} L${sz * 0.65} ${sz * 0.85} L${sz * 0.35} ${sz * 0.85} L${sz * 0.35} ${sz * 0.4} L${sz * 0.28} ${sz * 0.45} Z`}
          fill={c}
        />
      );
    }

    if (n.includes("西装") || n.includes("外套") || n.includes("夹克") || n.includes("工装") || n.includes("丝绒")) {
      return (
        <>
          <path
            d={`M${sz * 0.18} ${sz * 0.25} L${sz * 0.35} ${sz * 0.15} L${sz * 0.42} ${sz * 0.22} L${sz * 0.58} ${sz * 0.22} L${sz * 0.65} ${sz * 0.15} L${sz * 0.82} ${sz * 0.25} L${sz * 0.75} ${sz * 0.45} L${sz * 0.65} ${sz * 0.38} L${sz * 0.65} ${sz * 0.88} L${sz * 0.35} ${sz * 0.88} L${sz * 0.35} ${sz * 0.38} L${sz * 0.25} ${sz * 0.45} Z`}
            fill={c}
          />
          <path d={`M${sz * 0.42} ${sz * 0.22} L${sz * 0.5} ${sz * 0.88} L${sz * 0.58} ${sz * 0.22}`} fill={darkC} opacity="0.2" />
        </>
      );
    }

    return (
      <path
        d={`M${sz * 0.25} ${sz * 0.25} L${sz * 0.38} ${sz * 0.18} Q${sz * 0.5} ${sz * 0.28} ${sz * 0.62} ${sz * 0.18} L${sz * 0.75} ${sz * 0.25} L${sz * 0.68} ${sz * 0.4} L${sz * 0.62} ${sz * 0.35} L${sz * 0.62} ${sz * 0.82} L${sz * 0.38} ${sz * 0.82} L${sz * 0.38} ${sz * 0.35} L${sz * 0.32} ${sz * 0.4} Z`}
        fill={c}
      />
    );
  };

  const renderBottomShape = (name: string, color: string, scale: number) => {
    const n = name;
    const c = color;
    const darkC = getShade(c, -0.15);
    const sz = s * scale;

    if (n.includes("裤") || n.includes("工装")) {
      return (
        <>
          <path
            d={`M${sz * 0.3} ${sz * 0.1} L${sz * 0.7} ${sz * 0.1} L${sz * 0.72} ${sz * 0.9} L${sz * 0.58} ${sz * 0.95} L${sz * 0.5} ${sz * 0.35} L${sz * 0.42} ${sz * 0.95} L${sz * 0.28} ${sz * 0.9} Z`}
            fill={c}
          />
          <path d={`M${sz * 0.5} ${sz * 0.1} L${sz * 0.5} ${sz * 0.35}`} stroke={darkC} strokeWidth="1" opacity="0.5" />
        </>
      );
    }

    if (n.includes("裙")) {
      return (
        <>
          <path
            d={`M${sz * 0.28} ${sz * 0.1} L${sz * 0.72} ${sz * 0.1} L${sz * 0.82} ${sz * 0.9} L${sz * 0.18} ${sz * 0.9} Z`}
            fill={c}
          />
          {n.includes("百褶") && (
            <>
              {[0.35, 0.45, 0.55, 0.65, 0.75].map((x, i) => (
                <line key={i} x1={sz * x} y1={sz * 0.12} x2={sz * (x + 0.02)} y2={sz * 0.88} stroke={darkC} strokeWidth="1" opacity="0.3" />
              ))}
            </>
          )}
          {n.includes("碎花") && (
            <>
              {[
                [0.35, 0.3], [0.55, 0.25], [0.7, 0.35],
                [0.3, 0.55], [0.5, 0.5], [0.68, 0.6],
                [0.4, 0.75], [0.6, 0.78],
              ].map(([x, y], i) => (
                <circle key={i} cx={sz * x} cy={sz * y} r={sz * 0.025} fill={darkC} opacity="0.5" />
              ))}
            </>
          )}
        </>
      );
    }

    return (
      <path
        d={`M${sz * 0.3} ${sz * 0.1} L${sz * 0.7} ${sz * 0.1} L${sz * 0.72} ${sz * 0.9} L${sz * 0.58} ${sz * 0.95} L${sz * 0.5} ${sz * 0.35} L${sz * 0.42} ${sz * 0.95} L${sz * 0.28} ${sz * 0.9} Z`}
        fill={c}
      />
    );
  };

  const renderShoesShape = (name: string, color: string, scale: number) => {
    const c = color;
    const darkC = getShade(c, -0.2);
    const lightC = getShade(c, 0.2);
    const sz = s * scale;

    if (name.includes("靴") || name.includes("马丁")) {
      return (
        <>
          <rect x={sz * 0.28} y={sz * 0.25} width={sz * 0.18} height={sz * 0.55} rx="4" fill={c} />
          <path d={`M${sz * 0.28} ${sz * 0.75} L${sz * 0.28} ${sz * 0.8} Q${sz * 0.28} ${sz * 0.85} ${sz * 0.35} ${sz * 0.85} L${sz * 0.52} ${sz * 0.85}`} fill={c} />
          <rect x={sz * 0.26} y={sz * 0.83} width={sz * 0.28} height={sz * 0.08} rx="3" fill={darkC} />
          <rect x={sz * 0.56} y={sz * 0.25} width={sz * 0.18} height={sz * 0.55} rx="4" fill={c} />
          <path d={`M${sz * 0.56} ${sz * 0.75} L${sz * 0.56} ${sz * 0.8} Q${sz * 0.56} ${sz * 0.85} ${sz * 0.63} ${sz * 0.85} L${sz * 0.8} ${sz * 0.85}`} fill={c} />
          <rect x={sz * 0.54} y={sz * 0.83} width={sz * 0.28} height={sz * 0.08} rx="3" fill={darkC} />
        </>
      );
    }

    if (name.includes("老爹") || name.includes("运动") || name.includes("帆布") || name.includes("板鞋")) {
      return (
        <>
          <path d={`M${sz * 0.15} ${sz * 0.55} Q${sz * 0.1} ${sz * 0.55} ${sz * 0.12} ${sz * 0.65} L${sz * 0.45} ${sz * 0.7} L${sz * 0.48} ${sz * 0.55} Z`} fill={c} />
          <path d={`M${sz * 0.1} ${sz * 0.65} L${sz * 0.48} ${sz * 0.7} L${sz * 0.5} ${sz * 0.78} L${sz * 0.08} ${sz * 0.78} Q${sz * 0.05} ${sz * 0.72} ${sz * 0.1} ${sz * 0.65} Z`} fill={lightC} />
          <path d={`M${sz * 0.52} ${sz * 0.55} Q${sz * 0.47} ${sz * 0.55} ${sz * 0.49} ${sz * 0.65} L${sz * 0.82} ${sz * 0.7} L${sz * 0.85} ${sz * 0.55} Z`} fill={c} />
          <path d={`M${sz * 0.49} ${sz * 0.65} L${sz * 0.85} ${sz * 0.7} L${sz * 0.87} ${sz * 0.78} L${sz * 0.47} ${sz * 0.78} Q${sz * 0.44} ${sz * 0.72} ${sz * 0.49} ${sz * 0.65} Z`} fill={lightC} />
        </>
      );
    }

    if (name.includes("高跟") || name.includes("穆勒") || name.includes("乐福")) {
      return (
        <>
          <path d={`M${sz * 0.18} ${sz * 0.5} L${sz * 0.48} ${sz * 0.5} L${sz * 0.5} ${sz * 0.62} L${sz * 0.42} ${sz * 0.75} L${sz * 0.2} ${sz * 0.7} Z`} fill={c} />
          <rect x={sz * 0.4} y={sz * 0.7} width={sz * 0.06} height={sz * 0.2} fill={darkC} />
          <path d={`M${sz * 0.52} ${sz * 0.5} L${sz * 0.82} ${sz * 0.5} L${sz * 0.84} ${sz * 0.62} L${sz * 0.76} ${sz * 0.75} L${sz * 0.54} ${sz * 0.7} Z`} fill={c} />
          <rect x={sz * 0.74} y={sz * 0.7} width={sz * 0.06} height={sz * 0.2} fill={darkC} />
        </>
      );
    }

    return (
      <>
        <ellipse cx={sz * 0.32} cy={sz * 0.65} rx={sz * 0.18} ry={sz * 0.12} fill={c} />
        <ellipse cx={sz * 0.68} cy={sz * 0.65} rx={sz * 0.18} ry={sz * 0.12} fill={c} />
      </>
    );
  };

  return (
    <svg width={s} height={s * 1.25} viewBox={`0 0 ${s} ${s * 1.25}`}>
      <defs>
        <linearGradient id="outfit-bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
      </defs>
      <rect width={s} height={s * 1.25} fill="url(#outfit-bg-grad)" />

      <g transform={`translate(${s * 0.25}, ${s * 0.04})`}>
        {renderTopShape(topName, topColor, 0.5)}
      </g>

      <g transform={`translate(${s * 0.3}, ${s * 0.34})`}>
        {renderBottomShape(bottomName, bottomColor, 0.4)}
      </g>

      <g transform={`translate(${s * 0.22}, ${s * 0.68})`}>
        {renderShoesShape(shoeName, shoeColor, 0.56)}
      </g>
    </svg>
  );
}

function PoseIllustration({ poseName, size = 80 }: { poseName: string; size?: number }) {
  const strokeColor = "#ec4899";
  const s = size;

  const getPosePaths = () => {
    const name = poseName;
    if (name.includes("侧身") || name.includes("撩发")) {
      return (
        <>
          <circle cx={s * 0.5} cy={s * 0.18} r={s * 0.12} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.3} L${s * 0.45} ${s * 0.55}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.45} ${s * 0.38} Q${s * 0.65} ${s * 0.32} ${s * 0.62} ${s * 0.15}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.45} ${s * 0.4} L${s * 0.25} ${s * 0.5}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.45} ${s * 0.55} L${s * 0.35} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.45} ${s * 0.55} L${s * 0.55} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("托腮") || name.includes("沉思")) {
      return (
        <>
          <circle cx={s * 0.5} cy={s * 0.22} r={s * 0.12} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.34} L${s * 0.5} ${s * 0.55}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.4} Q${s * 0.3} ${s * 0.42} ${s * 0.3} ${s * 0.28}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.4} Q${s * 0.7} ${s * 0.42} ${s * 0.7} ${s * 0.28}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.38} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.62} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("回眸") || name.includes("回头")) {
      return (
        <>
          <circle cx={s * 0.55} cy={s * 0.18} r={s * 0.12} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.48} ${s * 0.3} L${s * 0.45} ${s * 0.55}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.45} ${s * 0.38} L${s * 0.65} ${s * 0.45}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.45} ${s * 0.38} L${s * 0.25} ${s * 0.45}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.45} ${s * 0.55} L${s * 0.35} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.45} ${s * 0.55} L${s * 0.55} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("倚靠") || name.includes("靠墙") || name.includes("倚窗")) {
      return (
        <>
          <line x1={s * 0.15} y1={s * 0.1} x2={s * 0.15} y2={s * 0.9} stroke="#cbd5e1" strokeWidth="3" />
          <circle cx={s * 0.45} cy={s * 0.2} r={s * 0.11} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.4} ${s * 0.31} L${s * 0.35} ${s * 0.55}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.35} ${s * 0.4} L${s * 0.18} ${s * 0.5}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.35} ${s * 0.4} L${s * 0.55} ${s * 0.35}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.35} ${s * 0.55} L${s * 0.25} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.35} ${s * 0.55} L${s * 0.48} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("走路") || name.includes("奔跑") || name.includes("抓拍")) {
      return (
        <>
          <circle cx={s * 0.5} cy={s * 0.15} r={s * 0.11} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.26} L${s * 0.45} ${s * 0.5}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.48} ${s * 0.35} L${s * 0.7} ${s * 0.28}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.48} ${s * 0.35} L${s * 0.25} ${s * 0.45}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.45} ${s * 0.5} L${s * 0.65} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.45} ${s * 0.5} L${s * 0.2} ${s * 0.75}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("插兜") || name.includes("耍酷")) {
      return (
        <>
          <circle cx={s * 0.5} cy={s * 0.16} r={s * 0.11} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.27} L${s * 0.5} ${s * 0.55}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.38} L${s * 0.3} ${s * 0.52}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.38} L${s * 0.7} ${s * 0.52}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.38} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.62} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("跨步") || name.includes("站姿")) {
      return (
        <>
          <circle cx={s * 0.5} cy={s * 0.15} r={s * 0.11} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.26} L${s * 0.5} ${s * 0.52}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.36} L${s * 0.7} ${s * 0.42}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.36} L${s * 0.28} ${s * 0.42}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.52} L${s * 0.7} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.52} L${s * 0.32} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("坐下") || name.includes("坐姿") || name.includes("品茶")) {
      return (
        <>
          <circle cx={s * 0.5} cy={s * 0.2} r={s * 0.11} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.31} L${s * 0.5} ${s * 0.55}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.42} L${s * 0.3} ${s * 0.55}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.42} L${s * 0.7} ${s * 0.55}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.75} ${s * 0.6} L${s * 0.78} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.28} ${s * 0.65} L${s * 0.25} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("撑伞") || name.includes("雨伞")) {
      return (
        <>
          <path d={`M${s * 0.15} ${s * 0.35} Q${s * 0.5} ${s * 0.1} ${s * 0.85} ${s * 0.35}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <line x1={s * 0.5} y1={s * 0.25} x2={s * 0.5} y2={s * 0.5} stroke={strokeColor} strokeWidth="2" />
          <circle cx={s * 0.5} cy={s * 0.45} r={s * 0.1} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.5} ${s * 0.75}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.62} L${s * 0.35} ${s * 0.7}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.62} L${s * 0.68} ${s * 0.65}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.75} L${s * 0.4} ${s * 0.92}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.75} L${s * 0.6} ${s * 0.92}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("跳跃") || name.includes("转圈") || name.includes("元气")) {
      return (
        <>
          <circle cx={s * 0.5} cy={s * 0.2} r={s * 0.11} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.31} L${s * 0.5} ${s * 0.5}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.4} L${s * 0.25} ${s * 0.25}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.4} L${s * 0.75} ${s * 0.25}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.5} L${s * 0.3} ${s * 0.75}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.5} L${s * 0.7} ${s * 0.75}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("背影") || name.includes("背对")) {
      return (
        <>
          <circle cx={s * 0.5} cy={s * 0.18} r={s * 0.11} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.29} L${s * 0.5} ${s * 0.55}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.38} L${s * 0.25} ${s * 0.35}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.38} L${s * 0.75} ${s * 0.35}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.4} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.6} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("比心") || name.includes("比耶") || name.includes("歪头")) {
      return (
        <>
          <circle cx={s * 0.55} cy={s * 0.2} r={s * 0.11} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.55} ${s * 0.31} L${s * 0.5} ${s * 0.55}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.55} ${s * 0.4} Q${s * 0.35} ${s * 0.38} ${s * 0.3} ${s * 0.22}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.55} ${s * 0.4} Q${s * 0.75} ${s * 0.38} ${s * 0.8} ${s * 0.22}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.4} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.6} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("扶椅") || name.includes("扶帽") || name.includes("手持")) {
      return (
        <>
          <circle cx={s * 0.5} cy={s * 0.16} r={s * 0.1} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.26} L${s * 0.48} ${s * 0.55}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.48} ${s * 0.37} L${s * 0.3} ${s * 0.45}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.48} ${s * 0.37} L${s * 0.65} ${s * 0.5}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.48} ${s * 0.55} L${s * 0.38} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.48} ${s * 0.55} L${s * 0.58} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    if (name.includes("撩裙摆") || name.includes("撩发")) {
      return (
        <>
          <circle cx={s * 0.5} cy={s * 0.15} r={s * 0.1} fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.25} L${s * 0.5} ${s * 0.52}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.35} Q${s * 0.7} ${s * 0.32} ${s * 0.72} ${s * 0.15}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.45} Q${s * 0.28} ${s * 0.55} ${s * 0.25} ${s * 0.7}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.52} L${s * 0.38} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
          <path d={`M${s * 0.5} ${s * 0.52} L${s * 0.62} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        </>
      );
    }
    return (
      <>
        <circle cx={s * 0.5} cy={s * 0.18} r={s * 0.11} fill="none" stroke={strokeColor} strokeWidth="2" />
        <path d={`M${s * 0.5} ${s * 0.29} L${s * 0.5} ${s * 0.55}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        <path d={`M${s * 0.5} ${s * 0.38} L${s * 0.28} ${s * 0.48}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        <path d={`M${s * 0.5} ${s * 0.38} L${s * 0.72} ${s * 0.48}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.38} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
        <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.62} ${s * 0.85}`} stroke={strokeColor} strokeWidth="2" fill="none" />
      </>
    );
  };

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <rect width={s} height={s} rx="12" fill="#fdf2f8" />
      {getPosePaths()}
    </svg>
  );
}

function CompositionIllustration({ compName, size = 80 }: { compName: string; size?: number }) {
  const s = size;
  const frameColor = "#10b981";
  const lineColor = "#34d399";

  const getCompElements = () => {
    const name = compName;
    if (name.includes("三分法") || name.includes("九宫格")) {
      return (
        <>
          <line x1={s * 0.33} y1={s * 0.08} x2={s * 0.33} y2={s * 0.92} stroke={lineColor} strokeWidth="1.5" strokeDasharray="3,3" />
          <line x1={s * 0.67} y1={s * 0.08} x2={s * 0.67} y2={s * 0.92} stroke={lineColor} strokeWidth="1.5" strokeDasharray="3,3" />
          <line x1={s * 0.08} y1={s * 0.33} x2={s * 0.92} y2={s * 0.33} stroke={lineColor} strokeWidth="1.5" strokeDasharray="3,3" />
          <line x1={s * 0.08} y1={s * 0.67} x2={s * 0.92} y2={s * 0.67} stroke={lineColor} strokeWidth="1.5" strokeDasharray="3,3" />
          <circle cx={s * 0.33} cy={s * 0.67} r={s * 0.08} fill="none" stroke={frameColor} strokeWidth="2" />
          <circle cx={s * 0.33} cy={s * 0.67} r={s * 0.04} fill={frameColor} />
        </>
      );
    }
    if (name.includes("对角线")) {
      return (
        <>
          <line x1={s * 0.08} y1={s * 0.92} x2={s * 0.92} y2={s * 0.08} stroke={lineColor} strokeWidth="2" strokeDasharray="4,3" />
          <path d={`M${s * 0.2} ${s * 0.75} L${s * 0.5} ${s * 0.4} L${s * 0.58} ${s * 0.52} L${s * 0.3} ${s * 0.85} Z`} fill="none" stroke={frameColor} strokeWidth="2" />
          <circle cx={s * 0.45} cy={s * 0.48} r={s * 0.06} fill="none" stroke={frameColor} strokeWidth="2" />
        </>
      );
    }
    if (name.includes("留白") || name.includes("意境")) {
      return (
        <>
          <rect x={s * 0.08} y={s * 0.08} width={s * 0.84} height={s * 0.4} fill={lineColor} opacity="0.2" rx="4" />
          <text x={s * 0.5} y={s * 0.32} textAnchor="middle" fill={frameColor} fontSize="10" fontWeight="bold">留白</text>
          <circle cx={s * 0.5} cy={s * 0.7} r={s * 0.1} fill="none" stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.78} L${s * 0.45} ${s * 0.9} L${s * 0.55} ${s * 0.9} Z`} fill="none" stroke={frameColor} strokeWidth="2" />
        </>
      );
    }
    if (name.includes("前景") || name.includes("框架")) {
      return (
        <>
          <rect x={s * 0.08} y={s * 0.08} width={s * 0.3} height={s * 0.84} fill={lineColor} opacity="0.3" rx="4" />
          <rect x={s * 0.62} y={s * 0.08} width={s * 0.3} height={s * 0.84} fill={lineColor} opacity="0.3" rx="4" />
          <circle cx={s * 0.5} cy={s * 0.45} r={s * 0.08} fill="none" stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.53} L${s * 0.42} ${s * 0.85}`} stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.53} L${s * 0.58} ${s * 0.85}`} stroke={frameColor} strokeWidth="2" />
        </>
      );
    }
    if (name.includes("对称") || name.includes("中心")) {
      return (
        <>
          <line x1={s * 0.5} y1={s * 0.08} x2={s * 0.5} y2={s * 0.92} stroke={lineColor} strokeWidth="2" strokeDasharray="4,3" />
          <circle cx={s * 0.5} cy={s * 0.45} r={s * 0.12} fill="none" stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.57} L${s * 0.4} ${s * 0.85}`} stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.57} L${s * 0.6} ${s * 0.85}`} stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.35} ${s * 0.45} L${s * 0.65} ${s * 0.45}`} stroke={frameColor} strokeWidth="2" />
        </>
      );
    }
    if (name.includes("低角度") || name.includes("仰拍")) {
      return (
        <>
          <path d={`M${s * 0.08} ${s * 0.92} L${s * 0.5} ${s * 0.08} L${s * 0.92} ${s * 0.92} Z`} fill="none" stroke={lineColor} strokeWidth="2" strokeDasharray="4,3" />
          <circle cx={s * 0.5} cy={s * 0.35} r={s * 0.1} fill="none" stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.4} ${s * 0.45} L${s * 0.3} ${s * 0.85}`} stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.6} ${s * 0.45} L${s * 0.7} ${s * 0.85}`} stroke={frameColor} strokeWidth="2" />
        </>
      );
    }
    if (name.includes("特写") || name.includes("半身") || name.includes("大头")) {
      return (
        <>
          <rect x={s * 0.25} y={s * 0.1} width={s * 0.5} height={s * 0.6} rx="8" fill="none" stroke={lineColor} strokeWidth="2" strokeDasharray="4,3" />
          <circle cx={s * 0.5} cy={s * 0.35} r={s * 0.15} fill="none" stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.5} L${s * 0.5} ${s * 0.68}`} stroke={frameColor} strokeWidth="2" />
        </>
      );
    }
    if (name.includes("镜像") || name.includes("倒影") || name.includes("水面")) {
      return (
        <>
          <line x1={s * 0.08} y1={s * 0.5} x2={s * 0.92} y2={s * 0.5} stroke={lineColor} strokeWidth="2" />
          <circle cx={s * 0.35} cy={s * 0.32} r={s * 0.08} fill="none" stroke={frameColor} strokeWidth="2" />
          <circle cx={s * 0.35} cy={s * 0.68} r={s * 0.08} fill="none" stroke={frameColor} strokeWidth="2" opacity="0.5" />
          <path d={`M${s * 0.35} ${s * 0.4} L${s * 0.3} ${s * 0.48}`} stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.35} ${s * 0.6} L${s * 0.3} ${s * 0.52}`} stroke={frameColor} strokeWidth="2" opacity="0.5" />
          <text x={s * 0.7} y={s * 0.53} textAnchor="middle" fill={frameColor} fontSize="9" fontWeight="bold">镜面</text>
        </>
      );
    }
    if (name.includes("正方形") || name.includes("方形")) {
      return (
        <>
          <rect x={s * 0.15} y={s * 0.15} width={s * 0.7} height={s * 0.7} fill="none" stroke={lineColor} strokeWidth="2" strokeDasharray="4,3" />
          <circle cx={s * 0.5} cy={s * 0.4} r={s * 0.1} fill="none" stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.5} L${s * 0.42} ${s * 0.75}`} stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.5} L${s * 0.58} ${s * 0.75}`} stroke={frameColor} strokeWidth="2" />
        </>
      );
    }
    if (name.includes("九分") || name.includes("黄金")) {
      return (
        <>
          <line x1={s * 0.08} y1={s * 0.618} x2={s * 0.92} y2={s * 0.618} stroke={lineColor} strokeWidth="2" strokeDasharray="4,3" />
          <line x1={s * 0.618} y1={s * 0.08} x2={s * 0.618} y2={s * 0.92} stroke={lineColor} strokeWidth="2" strokeDasharray="4,3" />
          <circle cx={s * 0.618} cy={s * 0.618} r={s * 0.06} fill={frameColor} />
          <circle cx={s * 0.5} cy={s * 0.45} r={s * 0.09} fill="none" stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.54} L${s * 0.45} ${s * 0.82}`} stroke={frameColor} strokeWidth="2" />
          <path d={`M${s * 0.5} ${s * 0.54} L${s * 0.55} ${s * 0.82}`} stroke={frameColor} strokeWidth="2" />
        </>
      );
    }
    return (
      <>
        <rect x={s * 0.08} y={s * 0.08} width={s * 0.84} height={s * 0.84} rx="6" fill="none" stroke={lineColor} strokeWidth="2" strokeDasharray="4,3" />
        <circle cx={s * 0.5} cy={s * 0.45} r={s * 0.1} fill="none" stroke={frameColor} strokeWidth="2" />
        <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.42} ${s * 0.82}`} stroke={frameColor} strokeWidth="2" />
        <path d={`M${s * 0.5} ${s * 0.55} L${s * 0.58} ${s * 0.82}`} stroke={frameColor} strokeWidth="2" />
      </>
    );
  };

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <rect width={s} height={s} rx="12" fill="#ecfdf5" />
      <rect x={s * 0.06} y={s * 0.06} width={s * 0.88} height={s * 0.88} rx="8" fill="none" stroke={lineColor} strokeWidth="1.5" opacity="0.3" />
      {getCompElements()}
    </svg>
  );
}

const photoRecommendations = [
  {
    id: "photo-1",
    title: "韩系氛围感",
    outfitType: ["all"],
    weatherType: ["sunny", "cloudy"],
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop",
    poses: [
      { name: "侧身撩发", desc: "侧身站立，一只手轻轻撩起头发，眼神看向远方，营造自然氛围" },
      { name: "托腮沉思", desc: "双手托腮，微微低头，眼神放空，打造文静感" },
      { name: "回眸一笑", desc: "背对镜头，然后微微回头，露出侧脸笑容" },
      { name: "倚靠窗边", desc: "侧身靠在窗边，手捧咖啡杯，岁月静好" },
    ],
    compositions: [
      { name: "三分法", desc: "把人放在画面三分之一处，比居中更有美感" },
      { name: "留白构图", desc: "画面上方留出30%空间，让照片更有呼吸感" },
      { name: "前景虚化", desc: "用树叶或咖啡杯做前景，增加层次感" },
      { name: "镜像构图", desc: "利用镜子或玻璃反射，增加空间感" },
    ],
    tips: [
      { name: "最佳光线", desc: "上午10点前或下午4点后的自然光最柔和" },
      { name: "道具运用", desc: "咖啡杯、书本、手机都是很好的互动道具" },
      { name: "背景选择", desc: "咖啡厅的窗户、书架前、窗边的位置都很出片" },
      { name: "妆容建议", desc: "伪素颜妆容强调皮肤质感，眉毛要自然" },
    ],
    accessories: ["珍珠耳钉", "金色细链项链", "简约手表"],
  },
  {
    id: "photo-2",
    title: "街头潮流感",
    outfitType: ["casual", "street"],
    weatherType: ["all"],
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop",
    poses: [
      { name: "走路抓拍", desc: "自然行走姿势被抓拍，动态感十足" },
      { name: "插兜耍酷", desc: "双手插兜，身体微微倾斜，酷感十足" },
      { name: "倚靠墙边", desc: "身体靠在墙上，一只脚微微弯曲，轻松随意" },
      { name: "跨步站姿", desc: "一只脚向前跨出，手插裤兜，帅气有型" },
    ],
    compositions: [
      { name: "对角线构图", desc: "身体沿对角线放置，增加动感" },
      { name: "框架构图", desc: "利用门框、柱子等元素做框架" },
      { name: "低角度仰拍", desc: "从下往上拍，显得腿更长更有气场" },
      { name: "特写街景", desc: "街头背景占2/3，人物占1/3" },
    ],
    tips: [
      { name: "最佳光线", desc: "傍晚的逆光或街灯下最有氛围" },
      { name: "背景选择", desc: "涂鸦墙、霓虹灯牌、街头橱窗都是好背景" },
      { name: "配件点睛", desc: "棒球帽、墨镜、耳机等街头风配件加分" },
      { name: "表情管理", desc: "保持酷酷的表情或者大笑都可以" },
    ],
    accessories: ["棒球帽", "墨镜", "耳机", "工业风腰带"],
  },
  {
    id: "photo-3",
    title: "法式优雅风",
    outfitType: ["elegant", "vintage"],
    weatherType: ["sunny", "cloudy"],
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop",
    poses: [
      { name: "整理配饰", desc: "双手轻轻整理耳环或项链，优雅又自然" },
      { name: "倚窗远眺", desc: "侧身站在窗边，看向窗外，表情放松" },
      { name: "坐下品茶", desc: "端坐在咖啡厅，手握咖啡杯，岁月静好" },
      { name: "撩发转身", desc: "轻轻撩起头发，然后缓缓转身抓拍" },
    ],
    compositions: [
      { name: "侧身45度", desc: "身体微微侧转，展现穿搭全貌" },
      { name: "半身特写", desc: "重点展示上半身和配饰，更有精致感" },
      { name: "镜中倒影", desc: "利用镜子或玻璃拍摄，增加趣味性" },
      { name: "九分构图", desc: "画面下方留白，视觉重心在上方" },
    ],
    tips: [
      { name: "最佳光线", desc: "上午9-11点的自然光是最佳选择" },
      { name: "背景选择", desc: "复古咖啡馆、画廊、老式建筑前" },
      { name: "妆容建议", desc: "法式妆容强调自然，红唇是点睛之笔" },
      { name: "姿态要点", desc: "保持背部挺直，肩膀放松下沉" },
    ],
    accessories: ["硬币项链", "珍珠耳环", "复古丝巾", "草编包"],
  },
  {
    id: "photo-4",
    title: "雨天文艺感",
    outfitType: ["all"],
    weatherType: ["rainy"],
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop",
    poses: [
      { name: "撑伞回眸", desc: "撑透明雨伞，微微回头，露出微笑" },
      { name: "玻璃窗边", desc: "站在玻璃窗前，让雨滴成为背景" },
      { name: "街角躲雨", desc: "靠在有屋檐的走廊，看雨发呆" },
      { name: "雨中共撑", desc: "和同伴共撑一把伞，互动感更强" },
    ],
    compositions: [
      { name: "雨伞特写", desc: "雨伞占据画面上方，形成天然框架" },
      { name: "水面倒影", desc: "利用地面水洼拍摄倒影，更有艺术感" },
      { name: "局部特写", desc: "聚焦雨伞、鞋子或穿搭细节" },
      { name: "意境留白", desc: "大面积雨景+小面积人物" },
    ],
    tips: [
      { name: "最佳光线", desc: "阴天的漫射光让肤色更柔和" },
      { name: "道具选择", desc: "透明长柄伞比折叠伞更上镜" },
      { name: "防水措施", desc: "手机防水袋必备，拍摄更自由" },
      { name: "穿搭建议", desc: "风衣或外套配雨伞，文艺感十足" },
    ],
    accessories: ["透明雨伞", "防水袋", "小巧斜挎包"],
  },
  {
    id: "photo-5",
    title: "职场专业感",
    outfitType: ["formal", "business"],
    weatherType: ["all"],
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop",
    poses: [
      { name: "自信站姿", desc: "双手自然下垂或交叠，站姿挺拔有气场" },
      { name: "扶椅微笑", desc: "手扶椅背，身体微微前倾，友善亲切" },
      { name: "坐姿商务", desc: "端坐在办公椅上，上半身挺直" },
      { name: "手持文件夹", desc: "拿着一份文件或文件夹，干练专业" },
    ],
    compositions: [
      { name: "三分之二侧", desc: "身体占画面2/3，展现西装剪裁" },
      { name: "背景虚化", desc: "让办公室背景虚化，突出人物" },
      { name: "对称构图", desc: "坐在桌前，画面左右对称，正式感强" },
      { name: "对角线站姿", desc: "身体倾斜对角线，干练不呆板" },
    ],
    tips: [
      { name: "最佳光线", desc: "室内人造光+窗户自然光补光最佳" },
      { name: "背景选择", desc: "写字楼大堂、会议室、落地窗前" },
      { name: "配饰建议", desc: "手表、公文包等商务配饰增加专业感" },
      { name: "仪态要点", desc: "收腹挺胸，下巴微抬，气场全开" },
    ],
    accessories: ["商务手表", "公文包", "简约项链", "皮带"],
  },
  {
    id: "photo-6",
    title: "度假休闲风",
    outfitType: ["vacation", "casual"],
    weatherType: ["sunny"],
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop",
    poses: [
      { name: "跳跃抓拍", desc: "原地跳跃，裙摆飞扬，充满活力" },
      { name: "奔跑动感", desc: "向镜头跑来，表情生动活泼" },
      { name: "海边漫步", desc: "海边行走，被海风吹起头发" },
      { name: "背影杀手", desc: "背对镜头，双手张开，拥抱大自然" },
    ],
    compositions: [
      { name: "全景模式", desc: "展现蓝天白云背景，人物占1/3" },
      { name: "低角度广角", desc: "从低处往上拍，海天一色更壮观" },
      { name: "框架前景", desc: "用椰子树或帽子做前景构图" },
      { name: "黄金比例", desc: "按照黄金分割点放置人物" },
    ],
    tips: [
      { name: "最佳光线", desc: "日出后1小时或日落前2小时光线最美" },
      { name: "背景选择", desc: "海边沙滩、椰林小道、彩色建筑前" },
      { name: "服装建议", desc: "飘逸的长裙在海边最上镜" },
      { name: "防晒准备", desc: "户外拍摄记得带防晒霜和补妆工具" },
    ],
    accessories: ["草编帽", "太阳镜", "草编包", "耳环"],
  },
  {
    id: "photo-7",
    title: "甜美可爱风",
    outfitType: ["sweet", "cute"],
    weatherType: ["sunny", "cloudy"],
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop",
    poses: [
      { name: "比心手势", desc: "双手比心或者单手比耶，俏皮可爱" },
      { name: "歪头杀", desc: "微微歪头，露出甜甜的笑容" },
      { name: "拿道具卖萌", desc: "拿着冰淇淋、气球等可爱道具" },
      { name: "元气跳跃", desc: "自然跳跃或原地转圈，灵动可爱" },
    ],
    compositions: [
      { name: "特写大头", desc: "重点拍上半身和表情" },
      { name: "俯拍萌照", desc: "从上方45度俯拍，显脸小可爱" },
      { name: "九宫格构图", desc: "把眼睛放在九宫格上格线上" },
      { name: "前景装饰", desc: "用花朵或公仔做装饰，增加可爱感" },
    ],
    tips: [
      { name: "最佳光线", desc: "柔和的自然光，让皮肤看起来更嫩" },
      { name: "背景选择", desc: "粉色系背景、棉花糖店、游乐场" },
      { name: "表情建议", desc: "露齿笑或嘟嘟嘴都可以" },
      { name: "互动技巧", desc: "和道具互动，自然不僵硬" },
    ],
    accessories: ["蝴蝶结发夹", "粉色包包", "可爱耳环", "珍珠发圈"],
  },
  {
    id: "photo-8",
    title: "复古怀旧风",
    outfitType: ["vintage", "retro"],
    weatherType: ["sunny", "cloudy"],
    image: "https://images.unsplash.com/photo-1551524438-a03a13185052?w=600&auto=format&fit=crop",
    poses: [
      { name: "手扶帽檐", desc: "复古宽檐帽，手轻轻扶住帽檐" },
      { name: "倚靠老物", desc: "靠在老式汽车、自行车旁拍照" },
      { name: "端庄站姿", desc: "双手交叠放在身前，端庄优雅" },
      { name: "撩裙摆", desc: "轻轻撩起裙摆，优雅又带点小性感" },
    ],
    compositions: [
      { name: "正方形构图", desc: "复古照片常用1:1方形构图" },
      { name: "边缘留白", desc: "人物放在画面一侧，留出想象空间" },
      { name: "颗粒感处理", desc: "后期可以加一些颗粒感更有复古味" },
      { name: "中心构图", desc: "人物放在画面正中央，庄重复古" },
    ],
    tips: [
      { name: "最佳光线", desc: "温暖的侧逆光最能营造复古氛围" },
      { name: "背景选择", desc: "老式建筑、怀旧咖啡馆、老街" },
      { name: "妆容建议", desc: "复古红唇、细弯眉是标配" },
      { name: "姿态要点", desc: "动作幅度小，优雅矜持" },
    ],
    accessories: ["复古耳环", "珍珠项链", "丝巾", "复古手包"],
  },
  {
    id: "photo-9",
    title: "日系清新风",
    outfitType: ["casual", "mori"],
    weatherType: ["sunny", "cloudy", "rainy"],
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop",
    poses: [
      { name: "自然行走", desc: "从远走近，自然抓拍，眼神温柔" },
      { name: "蹲下拍摄", desc: "蹲下身仰拍，展现穿搭同时显高" },
      { name: "手捧花束", desc: "拿着花束或绿植，清新自然" },
      { name: "随意坐姿", desc: "坐在台阶或草地上，放松随意" },
    ],
    compositions: [
      { name: "中景构图", desc: "膝盖以上取景，展示整体穿搭" },
      { name: "留白意境", desc: "画面留白60%，人物占40%" },
      { name: "低角度拍摄", desc: "从低处仰拍，自然不刻意" },
      { name: "前景运用", desc: "用花草做前景，增加层次" },
    ],
    tips: [
      { name: "最佳光线", desc: "阴天或树荫下的散射光最柔和" },
      { name: "背景选择", desc: "公园、神社、铁路、花田" },
      { name: "穿搭要点", desc: "棉麻材质、低饱和色彩、自然系" },
      { name: "表情管理", desc: "放松自然，像在发呆的感觉最好" },
    ],
    accessories: ["草编帽", "帆布包", "绿植", "棉麻围巾"],
  },
  {
    id: "photo-10",
    title: "夜景魅力感",
    outfitType: ["all"],
    weatherType: ["all"],
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop",
    poses: [
      { name: "霓虹灯下", desc: "靠在霓虹灯招牌旁，表情冷艳" },
      { name: "车流背景", desc: "背后是流动的车灯，动态模糊" },
      { name: "月光近景", desc: "用月光或路灯做轮廓光" },
      { name: "倚靠栏杆", desc: "双手扶着栏杆，帅气撩发" },
    ],
    compositions: [
      { name: "逆光剪影", desc: "只保留轮廓，表情神秘" },
      { name: "霓虹特写", desc: "聚焦在霓虹灯和穿搭上" },
      { name: "高低曝光", desc: "亮部过曝营造梦幻感" },
      { name: "框架夜景", desc: "用窗户或门框框住夜景" },
    ],
    tips: [
      { name: "最佳光线", desc: "晚上7-10点是夜景拍摄黄金时间" },
      { name: "曝光技巧", desc: "对人脸点测光，避免过曝" },
      { name: "防抖技巧", desc: "夜景快门慢，找支撑点或提高ISO" },
      { name: "穿搭建议", desc: "亮色服装在夜景更突出" },
    ],
    accessories: ["闪亮耳饰", "小巧手拿包", "精致项链"],
  },
];

const initialClosetItems = [
  // 上装
  { id: "t1", name: "黑色西装外套", category: "上装", color: "#1a1a1a", style: "通勤", worn: 18, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20black%20suit%20jacket%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "t2", name: "蓝色牛仔外套", category: "上装", color: "#3b82f6", style: "休闲", worn: 15, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20blue%20denim%20jacket%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "t3", name: "白色纯棉T恤", category: "上装", color: "#ffffff", style: "简约", worn: 12, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20white%20cotton%20tshirt%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "t4", name: "藏蓝休闲西装", category: "上装", color: "#1e3a5f", style: "通勤", worn: 20, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20navy%20blue%20casual%20blazer%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "t5", name: "浅蓝牛仔夹克", category: "上装", color: "#60a5fa", style: "法式", worn: 14, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20light%20blue%20denim%20jacket%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "t6", name: "米白棉麻衬衫", category: "上装", color: "#faf0e6", style: "日系", worn: 11, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20beige%20linen%20shirt%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "t7", name: "深灰休闲西装", category: "上装", color: "#4b5563", style: "简约", worn: 9, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20dark%20gray%20casual%20suit%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "t8", name: "复古牛仔夹克", category: "上装", color: "#1e40af", style: "复古", worn: 10, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20vintage%20blue%20denim%20jacket%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },

  // 下装
  { id: "b1", name: "黑色直筒牛仔裤", category: "下装", color: "#1a1a1a", style: "简约", worn: 20, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20black%20straight%20jeans%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "b2", name: "深灰休闲西裤", category: "下装", color: "#4b5563", style: "通勤", worn: 15, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20dark%20gray%20casual%20trousers%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "b3", name: "黑色吊带连衣裙", category: "下装", color: "#111827", style: "法式", worn: 12, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20black%20slip%20dress%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "b4", name: "卡其色工装短裤", category: "下装", color: "#c3b091", style: "街头", worn: 10, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20khaki%20cargo%20shorts%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "b5", name: "复古蓝牛仔裤", category: "下装", color: "#1e40af", style: "复古", worn: 16, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20vintage%20blue%20jeans%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "b6", name: "米色阔腿长裤", category: "下装", color: "#faf0e6", style: "温柔", worn: 11, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20beige%20wide%20leg%20pants%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "b7", name: "黑色小黑裙", category: "下装", color: "#1a1a1a", style: "通勤", worn: 9, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20black%20mini%20dress%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "b8", name: "军绿休闲短裤", category: "下装", color: "#365314", style: "日系", worn: 7, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20army%20green%20shorts%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },

  // 鞋履
  { id: "s1", name: "酒红色帆布鞋", category: "鞋履", color: "#7c2d12", style: "休闲", worn: 22, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20burgundy%20canvas%20sneakers%20shoes%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "s2", name: "红白运动老爹鞋", category: "鞋履", color: "#dc2626", style: "街头", worn: 18, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20red%20white%20chunky%20sneakers%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "s3", name: "棕色商务皮鞋", category: "鞋履", color: "#78350f", style: "通勤", worn: 15, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20brown%20leather%20dress%20shoes%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "s4", name: "棕色复古马丁靴", category: "鞋履", color: "#78350f", style: "复古", worn: 13, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20brown%20combat%20boots%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "s5", name: "黑色高帮帆布鞋", category: "鞋履", color: "#1a1a1a", style: "街头", worn: 16, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20black%20high%20top%20canvas%20shoes%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "s6", name: "黑色运动跑鞋", category: "鞋履", color: "#111827", style: "休闲", worn: 12, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20black%20running%20shoes%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },

  // 配饰
  { id: "a1", name: "金色简约项链", category: "配饰", color: "#ffd700", style: "简约", worn: 20, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20gold%20minimalist%20necklace%20jewelry%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "a2", name: "黑色托特手提包", category: "配饰", color: "#111827", style: "通勤", worn: 18, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20black%20tote%20handbag%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "a3", name: "黑色棒球帽", category: "配饰", color: "#1a1a1a", style: "街头", worn: 16, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20black%20baseball%20cap%20hat%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "a4", name: "草编太阳帽", category: "配饰", color: "#d4c5a9", style: "法式", worn: 9, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20straw%20sun%20hat%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "a5", name: "复古印花丝巾", category: "配饰", color: "#dc2626", style: "复古", worn: 7, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20vintage%20printed%20silk%20scarf%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
  { id: "a6", name: "精致钢带手表", category: "配饰", color: "#c0c0c0", style: "通勤", worn: 22, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flat%20lay%20silver%20stainless%20steel%20watch%20on%20white%20background%20product%20photography%20clean%20minimal&image_size=square" },
];

const categories = ["上装", "下装", "鞋履", "配饰"];

const colors = [
  { name: "白色", value: "#ffffff" },
  { name: "黑色", value: "#111827" },
  { name: "灰色", value: "#6b7280" },
  { name: "米色", value: "#fde68a" },
  { name: "蓝色", value: "#dbeafe" },
  { name: "粉色", value: "#f9a8d4" },
  { name: "紫色", value: "#c4b5fd" },
  { name: "棕色", value: "#78350f" },
];

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function hasAllPoints(points: Points): points is Record<KeypointId, Point> {
  return keypoints.every((point) => Boolean(points[point.id]));
}

function calculateRatios(points: Record<KeypointId, Point>): Ratios {
  const head = Math.max(distance(points.headTop, points.chin), 0.01);
  const body = Math.abs((points.leftAnkle.y + points.rightAnkle.y) / 2 - points.headTop.y);
  const shoulder = distance(points.leftShoulder, points.rightShoulder);
  const waist = distance(points.leftWaist, points.rightWaist);
  const hip = distance(points.leftHip, points.rightHip);
  const torso = Math.abs((points.leftHip.y + points.rightHip.y) / 2 - (points.leftShoulder.y + points.rightShoulder.y) / 2);
  const leg = Math.abs((points.leftAnkle.y + points.rightAnkle.y) / 2 - (points.leftHip.y + points.rightHip.y) / 2);
  const knee = Math.abs((points.leftKnee.y + points.rightKnee.y) / 2 - points.headTop.y);
  const armLeft = distance(points.leftShoulder, points.leftElbow) + distance(points.leftElbow, points.leftWaist);
  const armRight = distance(points.rightShoulder, points.rightElbow) + distance(points.rightElbow, points.rightWaist);
  const arm = Math.max(armLeft, armRight);

  return {
    headBody: Number((body / head).toFixed(1)),
    shoulderHead: Number((shoulder / head).toFixed(2)),
    waistShoulder: Number((waist / shoulder).toFixed(2)),
    shoulderHip: Number((shoulder / hip).toFixed(2)),
    legBody: Number((leg / body).toFixed(2)),
    torsoLength: Number((torso / body).toFixed(2)),
    kneeHeight: Number((knee / body).toFixed(2)),
    waistHip: Number((waist / hip).toFixed(2)),
    armLength: Number((arm / body).toFixed(2)),
    shoulderWidth: Number((shoulder / body).toFixed(2)),
  };
}

function determineBodyType(ratios: Ratios, gender: Gender): BodyType {
  const { waistShoulder, shoulderHip, waistHip, legBody } = ratios;
  
  if (gender === "female") {
    if (shoulderHip < 0.9 && waistShoulder > 0.75) return "inverted";
    if (shoulderHip > 1.05 && waistShoulder < 0.8) return "pear";
    if (Math.abs(shoulderHip - 1) < 0.1 && waistHip < 0.75) return "hourglass";
    if (legBody < 0.5 && waistShoulder > 0.85) return "apple";
    if (legBody > 0.52 && Math.abs(waistShoulder - shoulderHip) < 0.1) return "banana";
    return "rectangle";
  } else {
    if (shoulderHip < 0.85 && waistShoulder < 0.85) return "inverted";
    if (shoulderHip > 1.1 && waistShoulder < 0.75) return "pear";
    if (legBody > 0.52 && waistHip < 0.85) return "apple";
    if (Math.abs(shoulderHip - 1) < 0.15 && Math.abs(waistShoulder - shoulderHip) < 0.1) return "banana";
    return "rectangle";
  }
}

function weatherText(code: number) {
  if ([0, 1].includes(code)) return "晴朗";
  if ([2, 3, 45, 48].includes(code)) return "多云";
  if (code >= 51 && code <= 67) return "小雨";
  if (code >= 80 && code <= 99) return "阵雨";
  return "舒适";
}

function getWeatherRecommendation(temp: number, text: string) {
  let layers = [];
  let materials = [];
  
  if (temp >= 30) {
    layers = ["短袖", "短裤", "连衣裙"];
    materials = ["棉麻", "真丝", "轻薄面料"];
  } else if (temp >= 25) {
    layers = ["短袖", "薄长裤", "薄外套"];
    materials = ["棉质", "亚麻", "透气面料"];
  } else if (temp >= 20) {
    layers = ["长袖", "牛仔裤", "针织衫"];
    materials = ["棉", "羊毛混纺", "适中厚度"];
  } else if (temp >= 15) {
    layers = ["厚长袖", "厚长裤", "薄外套"];
    materials = ["羊毛", "抓绒", "保暖面料"];
  } else if (temp >= 10) {
    layers = ["毛衣", "加绒裤", "厚外套"];
    materials = ["羊毛", "羽绒", "加厚面料"];
  } else {
    layers = ["羽绒服", "保暖内衣", "厚围巾"];
    materials = ["羽绒", "羊绒", "防风面料"];
  }
  
  if (text.includes("雨")) {
    layers.push("雨衣");
    materials.push("防水面料");
  }
  
  return { layers, materials };
}

function ShellButton({
  children,
  onClick,
  active,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] ${
        active ? "bg-slate-950 text-white shadow-lg shadow-slate-300" : "bg-white/75 text-slate-700 hover:bg-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[8px] border border-white/70 bg-white/82 shadow-sm ${className}`}>{children}</section>;
}

function ImageUploader({ onImageSelect }: { onImageSelect: (url: string) => void }) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log("选择的文件:", file);
    
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("请上传图片文件 (JPEG, PNG, GIF, WebP)");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert("文件大小不能超过 10MB");
      return;
    }
    
    try {
      const objectUrl = URL.createObjectURL(file);
      console.log("创建的图片 URL:", objectUrl);
      onImageSelect(objectUrl);
      console.log("图片上传成功");
    } catch (error) {
      console.error("图片上传失败:", error);
      alert("图片上传失败，请重试");
    }
  };

  return (
    <div className="mb-4">
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleChange}
        className="hidden"
        id="upload-input"
      />
      <button
        onClick={() => document.getElementById('upload-input')?.click()}
        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-base font-bold text-slate-700 hover:border-blue-500 hover:bg-blue-50 transition-all"
      >
        <Upload className="h-8 w-8" />
        上传用户图片
      </button>
    </div>
  );
}

function WeatherIcon({ text }: { text: string }) {
  if (text.includes("雨")) return <CloudRain className="h-5 w-5 text-sky-600" />;
  if (text.includes("晴")) return <Sun className="h-5 w-5 text-amber-500" />;
  return <Cloud className="h-5 w-5 text-slate-500" />;
}

function AnnotationCanvas({
  image,
  points,
  setPoints,
  onComplete,
}: {
  image: string | null;
  points: Points;
  setPoints: (points: Points) => void;
  onComplete: (points: Record<KeypointId, Point>) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [cursor, setCursor] = useState(0);

  const draw = useCallback(
    (nextPoints: Points, img?: HTMLImageElement | null) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);

      const currentImage = img ?? imageRef.current;
      if (currentImage) {
        context.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        context.fillStyle = "rgba(15, 23, 42, 0.2)";
        context.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "#e0f2fe");
        gradient.addColorStop(1, "#f5d0fe");
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "rgba(15, 23, 42, 0.55)";
        context.font = "600 16px system-ui";
        context.textAlign = "center";
        context.fillText("上传照片后可在这里标注身体关键点", canvas.width / 2, canvas.height / 2);
      }

      skeleton.forEach(([from, to]) => {
        const a = nextPoints[from];
        const b = nextPoints[to];
        if (!a || !b) return;
        context.beginPath();
        context.moveTo(a.x * canvas.width, a.y * canvas.height);
        context.lineTo(b.x * canvas.width, b.y * canvas.height);
        context.strokeStyle = "rgba(255,255,255,0.8)";
        context.lineWidth = 2;
        context.stroke();
      });

      keypoints.forEach((point) => {
        const placed = nextPoints[point.id];
        if (!placed) return;
        const x = placed.x * canvas.width;
        const y = placed.y * canvas.height;
        context.beginPath();
        context.arc(x, y, 7, 0, Math.PI * 2);
        context.fillStyle = point.color;
        context.fill();
        context.strokeStyle = "#fff";
        context.lineWidth = 2;
        context.stroke();
        context.font = "700 12px system-ui";
        context.fillStyle = "#fff";
        context.textAlign = "center";
        context.fillText(point.label, x, y - 12);
      });
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 760;
    canvas.height = 940;
    if (!image) {
      imageRef.current = null;
      draw(points);
      return;
    }
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      draw(points, img);
      console.log("图片加载完成并绘制到画布");
    };
    img.onerror = (err) => {
      console.error("图片加载失败:", err);
      alert("图片加载失败，请尝试其他图片");
    };
    img.src = image;
  }, [draw, image, points]);

  const placePoint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (cursor >= keypoints.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const next = {
      ...points,
      [keypoints[cursor].id]: {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      },
    };
    setPoints(next);
    draw(next);
    const nextCursor = cursor + 1;
    setCursor(nextCursor);
    if (hasAllPoints(next)) onComplete(next);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onClick={placePoint}
        className="aspect-[3/4] w-full cursor-crosshair rounded-[8px] bg-slate-100 object-cover"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            当前标注：{cursor < keypoints.length ? keypoints[cursor].label : "已完成"}
          </p>
          <p className="text-xs text-slate-500">按提示依次点击照片，或使用演示节点快速生成结果。</p>
        </div>
        <div className="flex gap-2">
          <ShellButton
            onClick={() => {
              setCursor(0);
              setPoints({});
            }}
            className="py-2"
          >
            重置
          </ShellButton>
          <ShellButton
            onClick={() => {
              setCursor(keypoints.length);
              setPoints(demoPoints);
              draw(demoPoints);
              onComplete(demoPoints);
            }}
            active
            className="py-2"
          >
            使用演示节点
          </ShellButton>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [image, setImage] = useState<string | null>(null);
  const [points, setPoints] = useState<Points>({});
  const [ratios, setRatios] = useState<Ratios | null>(null);
  const [bodyType, setBodyType] = useState<BodyType | null>(null);
  const [gender, setGender] = useState<Gender>("female");
  const [weather, setWeather] = useState<Weather>({
    city: "深圳",
    temp: 26,
    text: "多云",
    humidity: 68,
    wind: 12,
    source: "demo",
  });
  const [occasion, setOccasion] = useState("通勤");
  const [style, setStyle] = useState("简约");
  const [ageRange, setAgeRange] = useState("26-35岁");
  const [occupation, setOccupation] = useState("办公室白领");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [selectedTryOn, setSelectedTryOn] = useState({
    top: "短款针织",
    bottom: "高腰直筒裤",
    shoes: "乐福鞋",
    topColor: "#fde68a",
    bottomColor: "#111827",
    shoesColor: "#78350f",
  });
  const [saved, setSaved] = useState<string[]>([]);
  const [closet, setCloset] = useState(initialClosetItems);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "上装", color: "#f8fafc", image: "" });
  const [inspirationFilter, setInspirationFilter] = useState("全部");
  const [currentCombination, setCurrentCombination] = useState<typeof initialClosetItems | null>(null);
  const [combinationTip, setCombinationTip] = useState("");
  const [isOpeningBlindBox, setIsOpeningBlindBox] = useState(false);
  const [blindBoxOpened, setBlindBoxOpened] = useState(false);
  const [blindBoxLevel, setBlindBoxLevel] = useState("");
  const [selectedTopIndex, setSelectedTopIndex] = useState(0);
  const [selectedBottomIndex, setSelectedBottomIndex] = useState(0);
  const [selectedShoeIndex, setSelectedShoeIndex] = useState(0);
  const [activePhotoTab, setActivePhotoTab] = useState(0);
  const [poseModal, setPoseModal] = useState<{ name: string; desc: string } | null>(null);
  const [compModal, setCompModal] = useState<{ name: string; desc: string } | null>(null);

  const completeAnalysis = (nextPoints: Record<KeypointId, Point>) => {
    const nextRatios = calculateRatios(nextPoints);
    setRatios(nextRatios);
    setBodyType(determineBodyType(nextRatios, gender));
  };

  const loadWeather = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
        const response = await fetch(url);
        const data = await response.json();
        setWeather({
          city: "当前位置",
          temp: Math.round(data.current.temperature_2m),
          text: weatherText(data.current.weather_code),
          humidity: data.current.relative_humidity_2m,
          wind: Math.round(data.current.wind_speed_10m),
          source: "live",
        });
      } catch {
        setWeather((old) => ({ ...old, source: "demo" }));
      }
    });
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const body = bodyType ? bodyMeta[bodyType] : null;
  const recommendations = useMemo(() => {
    const typed = bodyType ? outfitBase.filter((item) => item.body.includes(bodyType)) : outfitBase;
    const weatherRec = getWeatherRecommendation(weather.temp, weather.text);
    
    return typed
      .map((item) => {
        let score = 65;
        score += item.tags.includes(occasion) ? 12 : 0;
        score += weather.text.includes("雨") && item.tags.includes("雨天") ? 10 : 0;
        score += item.tags.includes(style) || (style === "通勤" && item.tags.includes("通勤")) ? 8 : 0;
        
        const weatherMatch = weatherRec.layers.some(layer => 
          item.pieces.some(piece => piece.includes(layer))
        );
        score += weatherMatch ? 8 : 0;
        
        const tempRange = item.weather;
        if (tempRange) {
          const [min, max] = tempRange.split("-").map(v => parseInt(v));
          if (weather.temp >= min && weather.temp <= max) {
            score += 5;
          }
        }
        
        score += preferences.includes("喜欢亮色") && item.pieces.some(p => ["米白", "白色", "浅色"].some(c => p.includes(c))) ? 5 : 0;
        score += preferences.includes("偏爱中性色") && !item.pieces.some(p => ["粉色", "红色", "黄色", "亮色"].some(c => p.includes(c))) ? 5 : 0;
        score += preferences.includes("偏爱宽松款") && item.pieces.some(p => ["阔腿", "宽松", "A字"].some(c => p.includes(c))) ? 4 : 0;
        score += preferences.includes("喜欢修身款") && item.pieces.some(p => ["收腰", "修身"].some(c => p.includes(c))) ? 4 : 0;
        return { ...item, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [bodyType, occasion, style, weather.text, weather.temp, preferences]);

  const filteredLooks = useMemo(() => {
    if (inspirationFilter === "全部") return inspirationLooks;
    return inspirationLooks.filter((look) => look.style === inspirationFilter);
  }, [inspirationFilter]);

  const tops = useMemo(() => closet.filter((item) => item.category === "上装"), [closet]);
  const bottoms = useMemo(() => closet.filter((item) => item.category === "下装"), [closet]);
  const shoes = useMemo(() => closet.filter((item) => item.category === "鞋履"), [closet]);

  const generateOutfitCombination = useCallback(() => {
    const tops = closet.filter((item) => item.category === "上装");
    const bottoms = closet.filter((item) => item.category === "下装");
    const shoes = closet.filter((item) => item.category === "鞋履");
    const accessories = closet.filter((item) => item.category === "配饰");

    if (tops.length === 0 || bottoms.length === 0 || shoes.length === 0) {
      alert("衣橱里的单品不够哦，请先添加上装、下装和鞋履~");
      return;
    }

    setIsOpeningBlindBox(true);
    setBlindBoxOpened(false);

    setTimeout(() => {
      // 随机选择一个风格作为主题
      const styles = ["简约", "温柔", "通勤", "法式", "甜美", "街头", "复古", "日系", "休闲"];
      const themeStyle = styles[Math.floor(Math.random() * styles.length)];

      // 风格搭配规则：确保上、下、鞋风格一致或兼容
      const styleCompatibility: Record<string, string[]> = {
        "简约": ["简约", "通勤", "法式", "休闲"],
        "温柔": ["温柔", "甜美", "法式", "日系"],
        "通勤": ["通勤", "简约", "法式"],
        "法式": ["法式", "简约", "温柔", "复古"],
        "甜美": ["甜美", "温柔", "日系"],
        "街头": ["街头", "休闲", "复古"],
        "复古": ["复古", "法式", "日系", "简约"],
        "日系": ["日系", "温柔", "甜美", "休闲"],
        "休闲": ["休闲", "简约", "街头", "日系"],
      };

      // 鞋履与下装搭配规则：避免不合理组合
      const shoeBottomCompatibility: Record<string, string[]> = {
        "简约": ["简约", "通勤", "法式", "休闲"],
        "温柔": ["温柔", "甜美", "日系"],
        "通勤": ["通勤", "简约", "法式"],
        "法式": ["法式", "简约", "温柔"],
        "甜美": ["甜美", "温柔", "日系"],
        "街头": ["街头", "休闲"],
        "复古": ["复古", "法式", "简约"],
        "日系": ["日系", "温柔", "休闲"],
        "休闲": ["休闲", "街头", "简约", "日系"],
      };

      // 获取兼容的风格列表
      const compatibleStyles = styleCompatibility[themeStyle] || [themeStyle];
      const compatibleShoeStyles = shoeBottomCompatibility[themeStyle] || [themeStyle];

      // 筛选匹配风格的单品
      const matchedTops = tops.filter(t => compatibleStyles.includes(t.style));
      const matchedBottoms = bottoms.filter(b => compatibleStyles.includes(b.style));
      const matchedShoes = shoes.filter(s => compatibleShoeStyles.includes(s.style));

      // 选择最佳上装
      let bestTop = matchedTops.length > 0
        ? matchedTops[Math.floor(Math.random() * matchedTops.length)]
        : tops[Math.floor(Math.random() * tops.length)];

      // 选择最佳下装（确保与上装风格兼容）
      const bottomCompatibleWithTop = matchedBottoms.filter(b =>
        compatibleStyles.includes(b.style) || b.style === bestTop.style
      );
      let bestBottom = bottomCompatibleWithTop.length > 0
        ? bottomCompatibleWithTop[Math.floor(Math.random() * bottomCompatibleWithTop.length)]
        : matchedBottoms.length > 0
          ? matchedBottoms[Math.floor(Math.random() * matchedBottoms.length)]
          : bottoms[Math.floor(Math.random() * bottoms.length)];

      // 选择最佳鞋履（确保与下装风格兼容）
      const shoeCompatibleWithBottom = matchedShoes.filter(s =>
        compatibleShoeStyles.includes(s.style) || s.style === bestBottom.style
      );
      let bestShoe = shoeCompatibleWithBottom.length > 0
        ? shoeCompatibleWithBottom[Math.floor(Math.random() * shoeCompatibleWithBottom.length)]
        : matchedShoes.length > 0
          ? matchedShoes[Math.floor(Math.random() * matchedShoes.length)]
          : shoes[Math.floor(Math.random() * shoes.length)];

      // 计算匹配得分
      let matchScore = 0;
      let matchedCount = 0;

      // 风格匹配得分
      if (bestTop.style === themeStyle || compatibleStyles.includes(bestTop.style)) {
        matchScore += 25;
        matchedCount++;
      }
      if (bestBottom.style === themeStyle || compatibleStyles.includes(bestBottom.style)) {
        matchScore += 25;
        matchedCount++;
      }
      if (bestShoe.style === themeStyle || compatibleShoeStyles.includes(bestShoe.style)) {
        matchScore += 25;
        matchedCount++;
      }

      // 上装+下装风格一致性
      if (bestTop.style === bestBottom.style) {
        matchScore += 15;
      } else if (compatibleStyles.includes(bestTop.style) && compatibleStyles.includes(bestBottom.style)) {
        matchScore += 8;
      }

      // 鞋履与下装风格一致性
      if (bestShoe.style === bestBottom.style) {
        matchScore += 10;
      } else if (compatibleShoeStyles.includes(bestShoe.style)) {
        matchScore += 5;
      }

      // 定义色系分组（扩展版）
      const colorGroups: Record<string, string[]> = {
        white: ["#ffffff", "#fffbeb", "#faf0e6", "#f5f5f5", "#fef3c7"],
        black: ["#1a1a1a", "#111827", "#000000"],
        gray: ["#6b7280", "#9ca3af", "#4b5563", "#e5e7eb"],
        beige: ["#d4c5a9", "#d4a574", "#e8ddd4", "#c3b091", "#f5f5dc", "#faf0e6"],
        blue: ["#1e3a5f", "#1e40af", "#3b82f6", "#60a5fa", "#a8d5e5", "#dbeafe", "#93c5fd", "#1e3a8a"],
        pink: ["#f472b6", "#fce7f3", "#ffb6c1", "#ffc0cb", "#f9a8d4", "#e9d5ff"],
        brown: ["#78350f", "#92400e", "#8b4513", "#a16207"],
        red: ["#dc2626", "#b91c1c", "#ef4444", "#ff6b6b", "#881337"],
        green: ["#166534", "#365314", "#064e3b", "#16a34a", "#86efac"],
        purple: ["#7c3aed", "#8b5cf6", "#a855f7"],
        yellow: ["#fbbf24", "#f59e0b", "#fde68a"],
        gold: ["#ffd700", "#f59e0b"],
      };

      // 检查颜色是否在同一色系
      const getColorGroup = (color: string): string | null => {
        const lowerColor = color.toLowerCase();
        for (const [groupName, colors] of Object.entries(colorGroups)) {
          if (colors.some(c => c.toLowerCase() === lowerColor)) {
            return groupName;
          }
        }
        return null;
      };

      const topColorGroup = getColorGroup(bestTop.color);
      const bottomColorGroup = getColorGroup(bestBottom.color);
      const shoeColorGroup = getColorGroup(bestShoe.color);

      // 颜色协调性评分
      if (topColorGroup && topColorGroup === bottomColorGroup) {
        matchScore += 15; // 上装与下装同色系
      }
      if (bottomColorGroup && bottomColorGroup === shoeColorGroup) {
        matchScore += 10; // 下装与鞋履同色系
      }
      if (topColorGroup && topColorGroup === shoeColorGroup) {
        matchScore += 5; // 上装与鞋履同色系
      }

      // 经典搭配加分（黑白灰米色系任意组合）
      const classicColors = ["white", "black", "gray", "beige"];
      if (classicColors.includes(topColorGroup || "") &&
          classicColors.includes(bottomColorGroup || "") &&
          classicColors.includes(shoeColorGroup || "")) {
        matchScore += 10; // 经典色系搭配
      }

      // 确保不会出现离谱搭配的额外检查
      const isRidiculous =
        (bestBottom.name.includes("牛仔裤") && (bestShoe.name.includes("运动鞋") || bestShoe.name.includes("帆布鞋") && Math.random() > 0.5)) ||
        (bestBottom.style === "通勤" && bestShoe.style === "街头") && Math.random() > 0.5;

      // 如果检测到离谱搭配，强制重新选择
      if (isRidiculous && matchedCount < 2) {
        // 优先选择风格完全一致的组合
        const perfectMatches = tops.filter(t =>
          bottoms.some(b => b.style === t.style) &&
          shoes.some(s => s.style === t.style || compatibleShoeStyles.includes(s.style))
        );

        if (perfectMatches.length > 0) {
          bestTop = perfectMatches[Math.floor(Math.random() * perfectMatches.length)];
          const matchingBottoms = bottoms.filter(b => b.style === bestTop.style);
          const matchingShoes = shoes.filter(s => s.style === bestTop.style || compatibleShoeStyles.includes(s.style));

          if (matchingBottoms.length > 0) {
            bestBottom = matchingBottoms[Math.floor(Math.random() * matchingBottoms.length)];
          }
          if (matchingShoes.length > 0) {
            bestShoe = matchingShoes[Math.floor(Math.random() * matchingShoes.length)];
          }
          matchScore = 80 + Math.floor(Math.random() * 20);
        }
      }

      const combination = [bestTop, bestBottom, bestShoe];
      let bestAccessory: typeof initialClosetItems[0] | null = null;

      // 选择配饰（风格匹配）
      const matchedAccessories = accessories.filter(a =>
        a.style === themeStyle || compatibleStyles.includes(a.style) || a.style === bestTop.style
      );
      if (matchedAccessories.length > 0) {
        bestAccessory = matchedAccessories[Math.floor(Math.random() * matchedAccessories.length)];
        combination.push(bestAccessory);
      }

      setCurrentCombination(combination);

      // 根据匹配得分决定等级
      let level, tip;
      if (matchScore >= 85 && matchedCount >= 3) {
        level = "SSR";
        tip = `✨ 完美级搭配！${themeStyle}风格高度统一，色彩和谐悦目，这套穿搭简直是为你量身定制的！`;
      } else if (matchScore >= 70 && matchedCount >= 2) {
        level = "SR";
        tip = `🌟 精品搭配！${themeStyle}风格协调统一，${matchedCount >= 2 ? '两件单品完美呼应' : ''}，这套look绝对回头率超高！`;
      } else if (matchScore >= 50) {
        level = "R";
        tip = `💫 日常搭配！${matchedCount >= 1 ? `有${matchedCount}件单品风格统一，` : ''}舒适又得体，是不错的日常选择~`;
      } else {
        level = "N";
        tip = `🎁 基础搭配！虽然没有完美的风格统一，但通过配饰点缀也能穿出时尚感，建议加一条${bestAccessory ? '项链' : '腰带'}来提升整体感！`;
      }

      setCombinationTip(tip);
      setBlindBoxLevel(level);

      setIsOpeningBlindBox(false);
      setBlindBoxOpened(true);
    }, 1500);
  }, [closet]);

  const nav = [
    { id: "home" as Screen, label: "首页", icon: Home },
    { id: "analysis" as Screen, label: "分析", icon: Activity },
    { id: "recommend" as Screen, label: "推荐", icon: Shirt },
    { id: "inspiration" as Screen, label: "灵感", icon: Sparkles },
    { id: "photo" as Screen, label: "拍照", icon: Camera },
    { id: "closet" as Screen, label: "衣橱", icon: Archive },
  ];

  return (
    <div className="min-h-screen bg-[#eef2f3] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-6xl">
        <aside className="hidden w-64 shrink-0 border-r border-white/70 bg-white/50 p-5 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-slate-950 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">StyleAI</p>
              <p className="text-xs text-slate-500">个性化服装推荐系统</p>
            </div>
          </div>
          <div className="space-y-2">
            {nav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setScreen(id)}
                className={`flex w-full items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-semibold transition ${
                  screen === id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </aside>

        <main className="w-full pb-24 lg:pb-8">
          <div className="mx-auto max-w-4xl px-4 py-5 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                {screen === "home" && (
                  <>
                    <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-[8px] bg-slate-950 p-6 text-white">
                        <p className="mb-3 text-sm text-white/65">2D 身体关键节点 + 风格问卷 + 天气推荐</p>
                        <h1 className="max-w-xl text-3xl font-bold leading-tight lg:text-4xl">上传照片，标注关键点，得到可解释的穿搭建议。</h1>
                        <p className="mt-4 max-w-lg text-sm leading-6 text-white/70">
                          系统会计算头身比、头肩比、腰肩比、肩胯比，判断梨形、倒三角、沙漏或 H 型身材，并结合天气与场景推荐服装。
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <ShellButton onClick={() => setScreen("analysis")} active className="bg-white text-slate-950">
                            开始身材分析
                          </ShellButton>
                          <ShellButton onClick={() => setScreen("inspiration")} className="bg-white/10 text-white hover:bg-white/20">
                            探索穿搭灵感
                          </ShellButton>
                        </div>
                      </div>
                      <Card className="p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold">当地天气</p>
                            <p className="text-xs text-slate-500">{weather.source === "live" ? "浏览器定位实时获取" : "演示兜底数据"}</p>
                          </div>
                          <button onClick={loadWeather} className="rounded-[8px] bg-slate-100 p-2">
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-[8px] bg-sky-50">
                            <WeatherIcon text={weather.text} />
                          </div>
                          <div>
                            <p className="text-3xl font-bold">{weather.temp}°C</p>
                            <p className="flex items-center gap-1 text-sm text-slate-500">
                              <MapPin className="h-3.5 w-3.5" /> {weather.city} · {weather.text}
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-[8px] bg-slate-50 p-3">湿度 {weather.humidity}%</div>
                          <div className="rounded-[8px] bg-slate-50 p-3">风速 {weather.wind} km/h</div>
                        </div>
                        <div className="mt-4">
                          <p className="mb-2 text-sm font-bold text-slate-700">今日穿搭建议</p>
                          <div className="flex flex-wrap gap-2">
                            {getWeatherRecommendation(weather.temp, weather.text).layers.map((layer) => (
                              <span key={layer} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                {layer}
                              </span>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            推荐面料：{getWeatherRecommendation(weather.temp, weather.text).materials.join("、")}
                          </p>
                        </div>
                      </Card>
                    </section>
                    <section className="grid gap-4 md:grid-cols-3">
                      {["上传图片并标注 10 个关键点", "自动计算身体比例并分类", "生成适合天气与风格的搭配"].map((text, index) => (
                        <Card key={text} className="p-5">
                          <p className="mb-3 text-2xl font-bold text-slate-300">0{index + 1}</p>
                          <p className="font-semibold">{text}</p>
                        </Card>
                      ))}
                    </section>
                  </>
                )}

                {screen === "analysis" && (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold">身体关键点分析</h2>
                      <p className="mt-1 text-sm text-slate-500">上传正面全身照片后，按顺序标注关键点。演示时可直接使用演示节点。</p>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
                      <Card className="p-4">
                        <div className="mb-4 rounded-[8px] bg-slate-100 p-4">
                          <p className="mb-2 text-sm font-bold">选择性别</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setGender("female");
                                if (ratios) setBodyType(determineBodyType(ratios, "female"));
                              }}
                              className={`flex-1 rounded-[8px] px-4 py-3 font-semibold transition ${
                                gender === "female"
                                  ? "bg-pink-500 text-white"
                                  : "bg-white text-slate-700 hover:bg-pink-50 border border-pink-200"
                              }`}
                            >
                              女
                            </button>
                            <button
                              onClick={() => {
                                setGender("male");
                                if (ratios) setBodyType(determineBodyType(ratios, "male"));
                              }}
                              className={`flex-1 rounded-[8px] px-4 py-3 font-semibold transition ${
                                gender === "male"
                                  ? "bg-blue-500 text-white"
                                  : "bg-white text-slate-700 hover:bg-blue-50 border border-blue-200"
                              }`}
                            >
                              男
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">男女身体比例不同，分析结果会有所差异</p>
                        </div>
                        <ImageUploader
                          onImageSelect={(url) => {
                            setImage(url);
                            setPoints({});
                            setRatios(null);
                            setBodyType(null);
                          }}
                        />
                        <AnnotationCanvas image={image} points={points} setPoints={setPoints} onComplete={completeAnalysis} />
                      </Card>
                      <div className="space-y-4">
                        <Card className="p-5">
                          <p className="font-bold">分析结果</p>
                          {body && ratios ? (
                            <div className="mt-4 space-y-4">
                              <div className="rounded-[8px] p-4 text-white" style={{ backgroundColor: body.color }}>
                                <p className="text-xl font-bold">{body.name}</p>
                                <p className="mt-1 text-sm text-white/85">{body.summary}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <Metric label="头身比" value={`${ratios.headBody}:1`} />
                                <Metric label="肩宽指数" value={ratios.shoulderWidth} />
                                <Metric label="腰肩比" value={ratios.waistShoulder} />
                                <Metric label="肩胯比" value={ratios.shoulderHip} />
                                <Metric label="腰胯比" value={ratios.waistHip} />
                                <Metric label="腿身比" value={ratios.legBody} />
                                <Metric label="躯干占比" value={ratios.torsoLength} />
                                <Metric label="臂长占比" value={ratios.armLength} />
                                <Metric label="膝盖高度" value={`${(ratios.kneeHeight * 100).toFixed(0)}%`} />
                              </div>
                              {ratios.headBody >= 7 && (
                                <div className="rounded-[8px] bg-amber-50 p-3">
                                  <p className="text-sm font-bold text-amber-700">✨ 模特身材</p>
                                  <p className="mt-1 text-xs text-amber-600">{ratios.headBody}头身，是非常优秀的身材比例！</p>
                                </div>
                              )}
                              {ratios.headBody >= 6 && ratios.headBody < 7 && (
                                <div className="rounded-[8px] bg-green-50 p-3">
                                  <p className="text-sm font-bold text-green-700">✨ 女神身材</p>
                                  <p className="mt-1 text-xs text-green-600">{ratios.headBody}头身，身材比例非常好！</p>
                                </div>
                              )}
                              <div className="rounded-[8px] bg-emerald-50 p-4">
                                <p className="text-sm font-bold text-emerald-700">你的优势</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(gender === "female" ? body.strengths : (body.maleStrengths || body.strengths)).map((s) => (
                                    <span key={s} className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm font-bold text-slate-700">{gender === "female" ? "推荐领口" : "推荐领型"}</p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {(gender === "female" ? body.necklines : body.necklines.slice(0, 3)).map((n) => (
                                      <span key={n} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                                        {n}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-700">{gender === "female" ? "推荐裤装" : "推荐裤装"}</p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {(gender === "female" ? body.pants : (body.malePants || body.pants)).map((p) => (
                                      <span key={p} className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700">
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                {gender === "female" && (
                                  <div>
                                    <p className="text-sm font-bold text-slate-700">推荐裙装</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {body.skirts.map((s) => (
                                        <span key={s} className="rounded-full bg-pink-50 px-3 py-1 text-xs text-pink-700">
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-bold text-red-700">尽量避免</p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {(gender === "female" ? body.avoid : (body.maleAvoid || body.avoid)).map((a) => (
                                      <span key={a} className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">
                                        {a}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm leading-6 text-slate-600">{body.focus}</p>
                              <ShellButton onClick={() => setScreen("recommend")} active className="w-full">
                                查看推荐
                              </ShellButton>
                            </div>
                          ) : (
                            <p className="mt-4 text-sm leading-6 text-slate-500">完成关键点标注后，这里会展示比例计算、身材类型与穿搭方向。</p>
                          )}
                        </Card>
                      </div>
                    </div>
                  </>
                )}

                {screen === "recommend" && (
                  <>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-bold">个性化推荐</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {body ? `当前识别为${body.name}，已结合${weather.text}天气。` : "未分析时会展示通用推荐，可先完成身材分析。"}
                        </p>
                      </div>
                      <ShellButton onClick={() => setScreen("analysis")}>重新分析</ShellButton>
                    </div>
                    <Card className="p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Selector label="使用场景" value={occasion} setValue={setOccasion} options={["通勤", "日常", "约会", "旅行", "雨天", "正式", "运动"]} />
                        <Selector label="偏好风格" value={style} setValue={setStyle} options={["简约", "通勤", "休闲", "温柔", "机能", "复古", "甜美", "街头", "法式", "日系"]} />
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <Selector label="年龄范围" value={ageRange} setValue={setAgeRange} options={["18-25岁", "26-35岁", "36-45岁", "46岁以上"]} />
                        <Selector label="职业类型" value={occupation} setValue={setOccupation} options={["办公室白领", "自由职业", "学生", "创业人士", "其他"]} />
                      </div>
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-bold">个人偏好</p>
                        <div className="flex flex-wrap gap-2">
                          {["喜欢亮色", "偏爱中性色", "喜欢图案", "偏爱纯色", "喜欢修身款", "偏爱宽松款"].map((pref) => (
                            <button
                              key={pref}
                              onClick={() => {
                                const newPreferences = preferences.includes(pref)
                                  ? preferences.filter(p => p !== pref)
                                  : [...preferences, pref];
                                setPreferences(newPreferences);
                              }}
                              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                preferences.includes(pref)
                                  ? "bg-slate-950 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {pref}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Card>
                    <div className="grid gap-4 md:grid-cols-2">
                      {recommendations.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                          <img src={item.image} alt={item.name} className="h-56 w-full object-cover" />
                          <div className="p-4">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold">{item.name}</p>
                                <p className="mt-1 text-xs text-slate-500">{item.tags.join(" · ")} · {item.weather}</p>
                              </div>
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{item.score}%</span>
                            </div>
                            <p className="text-sm leading-6 text-slate-600">{item.reason}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.pieces.map((piece) => (
                                <span key={piece} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{piece}</span>
                              ))}
                            </div>
                            <div className="mt-4 flex gap-2">
                              <ShellButton
                                onClick={() => setSaved((old) => (old.includes(item.id) ? old.filter((id) => id !== item.id) : [...old, item.id]))}
                                active={saved.includes(item.id)}
                                className="flex-1"
                              >
                                <span className="inline-flex items-center justify-center gap-2">
                                  <Heart className="h-4 w-4" /> {saved.includes(item.id) ? "已收藏" : "收藏"}
                                </span>
                              </ShellButton>
                              <ShellButton onClick={() => setScreen("inspiration")} className="flex-1">灵感</ShellButton>
                              <button
                                onClick={() => {
                                  const shareData = {
                                    title: `推荐搭配: ${item.name}`,
                                    text: `${item.name} - ${item.reason}`,
                                  };
                                  if (navigator.share) {
                                    navigator.share(shareData);
                                  } else {
                                    navigator.clipboard.writeText(`${item.name}\n${item.reason}\n${item.pieces.join(", ")}`);
                                    alert("搭配信息已复制到剪贴板");
                                  }
                                }}
                                className="rounded-2xl px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-[0.98]"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                {screen === "inspiration" && (
                  <>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-bold">穿搭灵感</h2>
                        <p className="mt-1 text-sm text-slate-500">抽个穿搭盲盒，每天都有新惊喜！</p>
                      </div>
                    </div>

                    <Card className="p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-200/30 to-transparent rounded-bl-full" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200/30 to-transparent rounded-tr-full" />
                      
                      <div className="relative text-center">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                          🎁 每日穿搭盲盒
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          从你的衣橱中随机抽取一套搭配，看看今天的运气如何~
                        </p>

                        {!blindBoxOpened && !isOpeningBlindBox && (
                          <div className="mt-8">
                            <div className="mx-auto relative w-48 h-48 cursor-pointer group" onClick={generateOutfitCombination}>
                              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 rounded-2xl shadow-lg shadow-purple-300/50 group-hover:scale-105 transition duration-300 flex items-center justify-center">
                                <div className="text-center text-white">
                                  <div className="text-6xl mb-2">🎁</div>
                                  <p className="font-bold text-lg">点击开盒</p>
                                  <p className="text-xs text-white/70 mt-1">今天穿什么？</p>
                                </div>
                              </div>
                              <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                                今日限定
                              </div>
                            </div>
                            <button
                              onClick={generateOutfitCombination}
                              className="mt-6 px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition active:scale-95"
                            >
                              <span className="inline-flex items-center gap-2">
                                <Sparkles className="h-5 w-5" /> 抽取盲盒
                              </span>
                            </button>
                          </div>
                        )}

                        {isOpeningBlindBox && (
                          <div className="mt-8">
                            <div className="mx-auto w-48 h-48 relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 rounded-2xl animate-pulse flex items-center justify-center">
                                <div className="text-8xl animate-bounce">🎁</div>
                              </div>
                              <div className="absolute -inset-4 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 rounded-3xl opacity-30 animate-ping" />
                            </div>
                            <p className="mt-6 text-lg font-bold text-purple-600 animate-pulse">正在为你抽取...</p>
                            <p className="text-sm text-slate-500">今天会是什么惊喜呢~</p>
                          </div>
                        )}

                        {blindBoxOpened && currentCombination && !isOpeningBlindBox && (
                          <div className="mt-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200">
                              <span className="text-2xl">
                                {blindBoxLevel === "SSR" ? "👑" : blindBoxLevel === "SR" ? "⭐" : blindBoxLevel === "R" ? "💎" : "🎀"}
                              </span>
                              <span className="font-bold text-amber-700">{blindBoxLevel} 级搭配</span>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-3 gap-3">
                              {currentCombination.map((item, idx) => (
                                <div key={item.id} className="text-center" style={{ animation: `fadeInUp 0.5s ease ${idx * 0.1}s both` }}>
                                  <div className="aspect-square overflow-hidden rounded-xl border-2 border-purple-200 bg-slate-100 shadow-md">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <p className="mt-2 text-sm font-bold text-slate-700">{item.name}</p>
                                  <p className="text-xs text-slate-500">{item.category}</p>
                                </div>
                              ))}
                            </div>

                            <div className="mt-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-4 border border-purple-100">
                              <p className="text-sm font-bold text-purple-700">搭配点评</p>
                              <p className="mt-2 text-sm text-slate-600">{combinationTip}</p>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                onClick={generateOutfitCombination}
                                className="flex-1 min-w-[120px] px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow hover:shadow-lg transition active:scale-95"
                              >
                                <span className="inline-flex items-center justify-center gap-2">
                                  <RefreshCw className="h-4 w-4" /> 再抽一次
                                </span>
                              </button>
                              <button
                                onClick={() => setScreen("photo")}
                                className="flex-1 min-w-[120px] px-4 py-3 bg-white border-2 border-purple-300 text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition active:scale-95"
                              >
                                <span className="inline-flex items-center justify-center gap-2">
                                  <Camera className="h-4 w-4" /> 拍照推荐
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  const saved = JSON.parse(localStorage.getItem("blindBoxHistory") || "[]");
                                  saved.unshift({
                                    items: currentCombination,
                                    level: blindBoxLevel,
                                    tip: combinationTip,
                                    date: new Date().toISOString(),
                                  });
                                  localStorage.setItem("blindBoxHistory", JSON.stringify(saved.slice(0, 20)));
                                  alert("已收藏到盲盒记录！");
                                }}
                                className="flex-1 min-w-[120px] px-4 py-3 bg-white border-2 border-pink-300 text-pink-600 font-bold rounded-xl hover:bg-pink-50 transition active:scale-95"
                              >
                                <span className="inline-flex items-center justify-center gap-2">
                                  <Heart className="h-4 w-4" /> 收藏
                                </span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    <div>
                      <h3 className="text-lg font-bold">风格灵感</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {["全部", "法式", "简约", "街头", "日系", "复古", "甜美", "通勤", "休闲"].map((s) => (
                          <button
                            key={s}
                            onClick={() => setInspirationFilter(s)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              inspirationFilter === s
                                ? "bg-slate-950 text-white"
                                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredLooks.map((look) => (
                        <Card key={look.id} className="overflow-hidden group cursor-pointer" onClick={() => setScreen("photo")}>
                          <div className="relative aspect-[3/4] overflow-hidden">
                            <img
                              src={look.image}
                              alt={look.title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold text-purple-600">
                              📸 拍照攻略
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                              <p className="font-bold text-lg">{look.title}</p>
                              <p className="text-sm text-white/80">{look.description}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex gap-1">
                                  {look.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full bg-white/20 px-2 py-0.5 text-xs backdrop-blur"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  <span className="text-sm">{look.likes}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <Card className="p-5">
                      <h3 className="text-lg font-bold">📅 每日穿搭挑战</h3>
                      <p className="mt-1 text-sm text-slate-500">每天一个小挑战，让穿搭更有趣</p>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        {[
                          { day: "周一", challenge: "全身上下不超过3种颜色", done: true, reward: "🌟 基础星星" },
                          { day: "周二", challenge: "尝试一种新的配色组合", done: false, reward: "🎨 配色达人" },
                          { day: "周三", challenge: "用配饰点亮整体造型", done: false, reward: "💍 饰品玩家" },
                        ].map((challenge) => (
                          <div
                            key={challenge.day}
                            className={`rounded-xl p-4 border transition ${
                              challenge.done
                                ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold">{challenge.day}</p>
                              {challenge.done ? (
                                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs text-white font-bold">
                                  ✓ 已完成
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                                  待挑战
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-slate-700 font-medium">{challenge.challenge}</p>
                            <p className="mt-1 text-xs text-slate-500">奖励：{challenge.reward}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </>
                )}

                {screen === "closet" && (
                  <>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-bold">衣橱搭配</h2>
                        <p className="mt-1 text-sm text-slate-500">上下滑动选择单品，即时预览搭配效果</p>
                      </div>
                      <ShellButton onClick={() => setShowAddModal(true)} active>
                        <span className="inline-flex items-center gap-2">
                          <Upload className="h-4 w-4" /> 添加单品
                        </span>
                      </ShellButton>
                    </div>
                    <Card className="p-6">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedTopIndex((i) => (i - 1 + tops.length) % tops.length)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                          >
                            ←
                          </button>
                          <div className="flex flex-col items-center">
                            <span className="mb-2 text-xs font-semibold text-slate-500">👕 上装 · {selectedTopIndex + 1}/{tops.length}</span>
                            <div className="h-48 w-40 overflow-hidden rounded-[12px] border-2 border-slate-200 bg-white shadow-md">
                              <img
                                src={tops[selectedTopIndex]?.image}
                                alt={tops[selectedTopIndex]?.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </div>
                            <p className="mt-2 text-sm font-semibold">{tops[selectedTopIndex]?.name}</p>
                            <p className="text-xs text-slate-500">{tops[selectedTopIndex]?.style}风格</p>
                          </div>
                          <button
                            onClick={() => setSelectedTopIndex((i) => (i + 1) % tops.length)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                          >
                            →
                          </button>
                        </div>
                        <div className="text-2xl text-slate-300">⬇</div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedBottomIndex((i) => (i - 1 + bottoms.length) % bottoms.length)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                          >
                            ←
                          </button>
                          <div className="flex flex-col items-center">
                            <span className="mb-2 text-xs font-semibold text-slate-500">👖 下装 · {selectedBottomIndex + 1}/{bottoms.length}</span>
                            <div className="h-48 w-40 overflow-hidden rounded-[12px] border-2 border-slate-200 bg-white shadow-md">
                              <img
                                src={bottoms[selectedBottomIndex]?.image}
                                alt={bottoms[selectedBottomIndex]?.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </div>
                            <p className="mt-2 text-sm font-semibold">{bottoms[selectedBottomIndex]?.name}</p>
                            <p className="text-xs text-slate-500">{bottoms[selectedBottomIndex]?.style}风格</p>
                          </div>
                          <button
                            onClick={() => setSelectedBottomIndex((i) => (i + 1) % bottoms.length)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                          >
                            →
                          </button>
                        </div>
                        <div className="text-2xl text-slate-300">⬇</div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedShoeIndex((i) => (i - 1 + shoes.length) % shoes.length)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                          >
                            ←
                          </button>
                          <div className="flex flex-col items-center">
                            <span className="mb-2 text-xs font-semibold text-slate-500">👟 鞋履 · {selectedShoeIndex + 1}/{shoes.length}</span>
                            <div className="h-36 w-40 overflow-hidden rounded-[12px] border-2 border-slate-200 bg-white shadow-md">
                              <img
                                src={shoes[selectedShoeIndex]?.image}
                                alt={shoes[selectedShoeIndex]?.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </div>
                            <p className="mt-2 text-sm font-semibold">{shoes[selectedShoeIndex]?.name}</p>
                            <p className="text-xs text-slate-500">{shoes[selectedShoeIndex]?.style}风格</p>
                          </div>
                          <button
                            onClick={() => setSelectedShoeIndex((i) => (i + 1) % shoes.length)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                          >
                            →
                          </button>
                        </div>
                      </div>
                      <div className="mt-6 rounded-[12px] bg-gradient-to-r from-purple-50 to-pink-50 p-4">
                        <h4 className="font-bold text-purple-900">✨ 当前搭配点评</h4>
                        <p className="mt-2 text-sm text-purple-800">
                          {tops[selectedTopIndex]?.style}风格上装 + {bottoms[selectedBottomIndex]?.style}风格下装 + {shoes[selectedShoeIndex]?.style}风格鞋履
                        </p>
                        <p className="mt-1 text-xs text-purple-600">
                          {tops[selectedTopIndex]?.style === bottoms[selectedBottomIndex]?.style && bottoms[selectedBottomIndex]?.style === shoes[selectedShoeIndex]?.style
                            ? "风格高度统一！这是一套完美的" + tops[selectedTopIndex]?.style + "风搭配，整体性很强 🌟"
                            : tops[selectedTopIndex]?.style === bottoms[selectedBottomIndex]?.style || bottoms[selectedBottomIndex]?.style === shoes[selectedShoeIndex]?.style || tops[selectedTopIndex]?.style === shoes[selectedShoeIndex]?.style
                              ? "风格基本协调，两件单品风格呼应，整体搭配和谐 👍"
                              : "风格混搭，建议通过配饰来调和整体感，可以尝试加一条项链或腰带 💡"
                          }
                        </p>
                        <div className="mt-3 flex gap-2">
                          <ShellButton onClick={generateOutfitCombination} active small>
                            <span className="inline-flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> 随机搭配
                            </span>
                          </ShellButton>
                          <ShellButton small>
                            <span className="inline-flex items-center gap-1">
                              <Heart className="h-3 w-3" /> 收藏
                            </span>
                          </ShellButton>
                        </div>
                      </div>
                    </Card>
                    <div className="mt-6">
                      <h3 className="mb-3 text-lg font-bold">快速浏览</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <Card className="p-3">
                          <h4 className="mb-2 text-sm font-semibold text-slate-700">上装 ({tops.length})</h4>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {tops.map((item, idx) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedTopIndex(idx)}
                                className={`flex-shrink-0 overflow-hidden rounded-[8px] border-2 transition ${
                                  idx === selectedTopIndex ? "border-purple-500 scale-105" : "border-slate-200"
                                }`}
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-16 w-16 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        </Card>
                        <Card className="p-3">
                          <h4 className="mb-2 text-sm font-semibold text-slate-700">下装 ({bottoms.length})</h4>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {bottoms.map((item, idx) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedBottomIndex(idx)}
                                className={`flex-shrink-0 overflow-hidden rounded-[8px] border-2 transition ${
                                  idx === selectedBottomIndex ? "border-purple-500" : ""
                                }`}
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-16 w-16 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        </Card>
                        <Card className="p-3">
                          <h4 className="mb-2 text-sm font-semibold text-slate-700">鞋履 ({shoes.length})</h4>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {shoes.map((item, idx) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedShoeIndex(idx)}
                                className={`flex-shrink-0 overflow-hidden rounded-[8px] border-2 transition ${
                                  idx === selectedShoeIndex ? "border-purple-500 scale-105" : "border-slate-200"
                                }`}
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-16 w-16 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        </Card>
                      </div>
                    </div>
                    {showAddModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <Card className="w-full max-w-md p-6">
                          <h3 className="text-lg font-bold">添加新单品</h3>
                          <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                              <label className="mb-1 block text-sm font-semibold">名称</label>
                              <input
                                type="text"
                                value={newItem.name}
                                onChange={(e) => setNewItem((old) => ({ ...old, name: e.target.value }))}
                                className="w-full rounded-[8px] border border-slate-300 px-4 py-2 text-sm"
                                placeholder="输入单品名称"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-semibold">分类</label>
                              <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                  <button
                                    key={cat}
                                    onClick={() => setNewItem((old) => ({ ...old, category: cat }))}
                                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                      newItem.category === cat
                                        ? "bg-slate-950 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-semibold">颜色</label>
                              <div className="flex flex-wrap gap-2">
                                {colors.map((c) => (
                                  <button
                                    key={c.value}
                                    onClick={() => setNewItem((old) => ({ ...old, color: c.value }))}
                                    className={`h-8 w-8 rounded-full border-2 transition ${
                                      newItem.color === c.value ? "border-slate-950 scale-110" : "border-slate-200 hover:scale-105"
                                    }`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.name}
                                  />
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-semibold">图片链接（可选）</label>
                              <input
                                type="text"
                                value={newItem.image}
                                onChange={(e) => setNewItem((old) => ({ ...old, image: e.target.value }))}
                                className="w-full rounded-[8px] border border-slate-300 px-4 py-2 text-sm"
                                placeholder="输入图片URL"
                              />
                              <p className="mt-1 text-xs text-slate-400">不填将使用默认图片</p>
                            </div>
                          </div>
                          <div className="mt-6 flex gap-3">
                            <ShellButton onClick={() => setShowAddModal(false)}>取消</ShellButton>
                            <ShellButton
                              onClick={() => {
                                if (!newItem.name.trim()) return;
                                const defaultImages: Record<string, string> = {
                                  "上装": "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&auto=format&fit=crop",
                                  "下装": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&auto=format&fit=crop",
                                  "鞋履": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop",
                                  "配饰": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop",
                                };
                                setCloset((old) => [
                                  ...old,
                                  {
                                    id: Date.now().toString(),
                                    name: newItem.name,
                                    category: newItem.category,
                                    color: newItem.color,
                                    style: "简约",
                                    worn: 0,
                                    image: newItem.image || defaultImages[newItem.category] || "",
                                  },
                                ]);
                                setNewItem({ name: "", category: "上装", color: "#f8fafc", image: "" });
                                setShowAddModal(false);
                              }}
                              active
                            >
                              添加
                            </ShellButton>
                          </div>
                        </Card>
                      </div>
                    )}
                  </>
                )}

                {screen === "photo" && (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold">拍照推荐</h2>
                      <p className="mt-1 text-sm text-slate-500">选择风格，获取专属拍照姿势、构图和技巧</p>
                    </div>

                    <Card className="p-5">
                      <div className="mb-4 flex items-center gap-4 rounded-[8px] bg-gradient-to-r from-sky-50 to-indigo-50 p-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-white shadow-sm">
                          {weather.text.includes("雨") ? (
                            <CloudRain className="h-8 w-8 text-sky-600" />
                          ) : weather.text.includes("晴") ? (
                            <Sun className="h-8 w-8 text-amber-500" />
                          ) : (
                            <Cloud className="h-8 w-8 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-sky-700">今日天气 · {weather.city}</p>
                          <p className="text-2xl font-bold">{weather.temp}°C · {weather.text}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {photoRecommendations.map((photo, idx) => (
                          <button
                            key={photo.id}
                            onClick={() => setActivePhotoTab(idx)}
                            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                              activePhotoTab === idx
                                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {photo.title}
                          </button>
                        ))}
                      </div>
                    </Card>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activePhotoTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="overflow-hidden">
                          <div className="relative">
                            <img
                              src={photoRecommendations[activePhotoTab]?.image}
                              alt={photoRecommendations[activePhotoTab]?.title}
                              className="h-64 w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-6 text-white">
                              <p className="text-3xl font-bold">{photoRecommendations[activePhotoTab]?.title}</p>
                              <p className="mt-2 text-sm text-white/80">
                                适配：{photoRecommendations[activePhotoTab]?.weatherType.map(w => 
                                  w === "sunny" ? "晴天" : w === "cloudy" ? "阴天" : w === "rainy" ? "雨天" : "所有天气"
                                ).join("、")}
                              </p>
                            </div>
                          </div>
                          <div className="p-6">
                            <div className="grid gap-6 md:grid-cols-3">
                              <div>
                                <p className="mb-3 flex items-center gap-2 text-base font-bold text-pink-600">
                                  <span className="text-xl">🤳</span> 推荐姿势
                                </p>
                                <div className="space-y-3">
                                  {photoRecommendations[activePhotoTab]?.poses.map((pose, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => setPoseModal(pose)}
                                      className="w-full rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 p-3 text-left transition hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                      <div className="flex items-start gap-3">
                                        <PoseIllustration poseName={pose.name} size={64} />
                                        <div className="flex-1">
                                          <p className="font-bold text-pink-700">{pose.name}</p>
                                          <p className="mt-1 text-xs text-pink-600 line-clamp-2">{pose.desc}</p>
                                          <p className="mt-1 text-[10px] font-semibold text-pink-400">点击查看大图 →</p>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="mb-3 flex items-center gap-2 text-base font-bold text-emerald-600">
                                  <span className="text-xl">📐</span> 构图技巧
                                </p>
                                <div className="space-y-3">
                                  {photoRecommendations[activePhotoTab]?.compositions.map((comp, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => setCompModal(comp)}
                                      className="w-full rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3 text-left transition hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                      <div className="flex items-start gap-3">
                                        <CompositionIllustration compName={comp.name} size={64} />
                                        <div className="flex-1">
                                          <p className="font-bold text-emerald-700">{comp.name}</p>
                                          <p className="mt-1 text-xs text-emerald-600 line-clamp-2">{comp.desc}</p>
                                          <p className="mt-1 text-[10px] font-semibold text-emerald-400">点击查看大图 →</p>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="mb-3 flex items-center gap-2 text-base font-bold text-amber-600">
                                  <span className="text-xl">💡</span> 拍摄贴士
                                </p>
                                <div className="space-y-3">
                                  {photoRecommendations[activePhotoTab]?.tips.map((tip, idx) => (
                                    <div key={idx} className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                                      <p className="font-bold text-amber-700">{tip.name}</p>
                                      <p className="mt-1 text-sm text-amber-600">{tip.desc}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {photoRecommendations[activePhotoTab]?.accessories && (
                              <div className="mt-6 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-4">
                                <p className="font-bold text-purple-700">✨ 推荐配饰</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {photoRecommendations[activePhotoTab]?.accessories.map((acc, idx) => (
                                    <span
                                      key={idx}
                                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-purple-600 shadow-sm"
                                    >
                                      {acc}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    </AnimatePresence>

                    <AnimatePresence>
                      {poseModal && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                          onClick={() => setPoseModal(null)}
                        >
                          <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="mb-4 flex items-center justify-between">
                              <h3 className="text-xl font-bold text-pink-600">🤳 {poseModal.name}</h3>
                              <button
                                onClick={() => setPoseModal(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="flex justify-center">
                              <PoseIllustration poseName={poseModal.name} size={240} />
                            </div>
                            <div className="mt-6 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 p-4">
                              <p className="text-sm font-semibold text-pink-700">动作要点</p>
                              <p className="mt-2 text-sm leading-relaxed text-pink-600">{poseModal.desc}</p>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                              <div className="rounded-xl bg-pink-50 p-3">
                                <p className="text-lg">👀</p>
                                <p className="mt-1 text-xs font-semibold text-pink-600">眼神自然</p>
                              </div>
                              <div className="rounded-xl bg-pink-50 p-3">
                                <p className="text-lg">💪</p>
                                <p className="mt-1 text-xs font-semibold text-pink-600">肩膀放松</p>
                              </div>
                              <div className="rounded-xl bg-pink-50 p-3">
                                <p className="text-lg">😊</p>
                                <p className="mt-1 text-xs font-semibold text-pink-600">表情自然</p>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {compModal && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                          onClick={() => setCompModal(null)}
                        >
                          <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="mb-4 flex items-center justify-between">
                              <h3 className="text-xl font-bold text-emerald-600">📐 {compModal.name}</h3>
                              <button
                                onClick={() => setCompModal(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="flex justify-center">
                              <CompositionIllustration compName={compModal.name} size={240} />
                            </div>
                            <div className="mt-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                              <p className="text-sm font-semibold text-emerald-700">构图要点</p>
                              <p className="mt-2 text-sm leading-relaxed text-emerald-600">{compModal.desc}</p>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                              <div className="rounded-xl bg-emerald-50 p-3">
                                <p className="text-lg">🎯</p>
                                <p className="mt-1 text-xs font-semibold text-emerald-600">突出主体</p>
                              </div>
                              <div className="rounded-xl bg-emerald-50 p-3">
                                <p className="text-lg">📏</p>
                                <p className="mt-1 text-xs font-semibold text-emerald-600">平衡画面</p>
                              </div>
                              <div className="rounded-xl bg-emerald-50 p-3">
                                <p className="text-lg">✨</p>
                                <p className="mt-1 text-xs font-semibold text-emerald-600">增加层次</p>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Card className="p-5">
                      <h3 className="text-lg font-bold">📚 摄影基础知识</h3>
                      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 p-4">
                          <p className="text-2xl">👁️</p>
                          <p className="mt-2 font-bold text-pink-700">眼神交流</p>
                          <p className="mt-1 text-xs text-pink-600">看着镜头更有亲和力，看别处更有故事感</p>
                        </div>
                        <div className="rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 p-4">
                          <p className="text-2xl">📏</p>
                          <p className="mt-2 font-bold text-blue-700">身体角度</p>
                          <p className="mt-1 text-xs text-blue-600">侧身45度显瘦，正面显自然，背面显神秘</p>
                        </div>
                        <div className="rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 p-4">
                          <p className="text-2xl">✋</p>
                          <p className="mt-2 font-bold text-purple-700">手部姿势</p>
                          <p className="mt-1 text-xs text-purple-600">不知道手放哪？插兜、摸头发、整理衣服都可以</p>
                        </div>
                        <div className="rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 p-4">
                          <p className="text-2xl">😊</p>
                          <p className="mt-2 font-bold text-amber-700">自然笑容</p>
                          <p className="mt-1 text-xs text-amber-600">想象开心的事，或者让朋友讲笑话</p>
                        </div>
                      </div>
                    </Card>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/90 px-2 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg justify-around">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setScreen(id)}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-[8px] px-3 py-2 text-[11px] font-semibold ${
                screen === id ? "bg-slate-950 text-white" : "text-slate-500"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[8px] bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function Selector({
  label,
  value,
  options,
  setValue,
}: {
  label: string;
  value: string;
  options: string[];
  setValue: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <ShellButton key={option} onClick={() => setValue(option)} active={value === option} className="py-2">
            {option}
          </ShellButton>
        ))}
      </div>
    </div>
  );
}

function TryOnPicker({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-sm font-bold">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`flex items-center justify-between rounded-[8px] border px-3 py-3 text-left text-sm font-semibold transition ${
              value === option ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            {option}
            {value === option && <Check className="h-4 w-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}
