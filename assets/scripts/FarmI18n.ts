export type Locale = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko';
export const LOCALES: Locale[] = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko'];
export const LOCALE_LABEL: Record<Locale, string> = {
  'zh-CN': '简体', 'zh-TW': '繁體', en: 'EN', ja: '日本語', ko: '한국어',
};
export const isLocale = (value: string | undefined): value is Locale => !!value && LOCALES.includes(value as Locale);

type Dict = Record<string, string>;
type Row = [string, string, string, string, string, string];

const rows: Row[] = [
  ['probe.only', '仅简体', '', '', '', ''],
  ['hud.agenda', '日程', '日程', 'Today', '日程', '오늘'],
  ['hud.share', '分享给朋友', '分享給朋友', 'Share with friends', '友だちへ送る', '친구에게 공유'],
  ['hud.later', '稍后', '稍後', 'Later', 'あとで', '나중에'],
  ['settings.audio', '声音与触感', '聲音與觸感', 'Sound and haptics', '音と振動', '소리와 진동'],
  ['settings.bgm', '音乐音量', '音樂音量', 'Music', '音楽の音量', '음악 볼륨'],
  ['settings.sfx', '音效音量', '音效音量', 'Effects', '効果音', '효과음'],
  ['settings.mute', '全部静音', '全部靜音', 'Mute all', 'すべて消音', '모두 끄기'],
  ['settings.unmute', '取消静音', '取消靜音', 'Unmute', '消音解除', '음소거 해제'],
  ['settings.lang', '语言', '語言', 'Language', '言語', '언어'],
  ['settings.code', '我的邀请码 {code}', '我的邀請碼 {code}', 'Your invite code {code}', '招待コード {code}', '초대 코드 {code}'],
  ['settings.redeem', '输入朋友的邀请码', '輸入朋友的邀請碼', 'Enter a friend’s code', '友だちのコードを入力', '친구 코드 입력'],
  ['settings.shareLatest', '分享刚才的卡片', '分享剛才的卡片', 'Share the latest card', 'さっきのカードを送る', '방금 카드 공유'],
  ['tut.welcome.title', '欢迎来到晴野', '歡迎來到晴野', 'Welcome to Sunny Meadow', '晴野へようこそ', '청야에 오신 걸 환영해요'],
  ['tut.welcome.body', '跟着做大约 5–15 分钟。可以随时跳过。结束后会告诉你明天还能回来做什么。', '跟著做大約 5–15 分鐘。可以隨時跳過。結束後會告訴你明天還能回來做什麼。', 'This first stroll takes about 5–15 minutes. Skip whenever you like. At the end you’ll see what is worth coming back for tomorrow.', '最初の案内はおよそ5〜15分。いつでもスキップできます。最後に、明日また来たくなる用事を伝えます。', '첫 안내는 약 5–15분이에요. 언제든 건너뛸 수 있고, 끝나면 내일 다시 올 이유를 알려 드려요.'],
  ['tut.harvest.title', '收下第一把麦子', '收下第一把麥子', 'Take the first wheat', '最初の麦を収穫', '첫 밀 수확'],
  ['tut.harvest.body', '点一块已经成熟的小麦。', '點一塊已經成熟的小麥。', 'Tap a ripe patch of wheat.', '色づいた小麦をタップ。', '익은 밀밭을 누르세요.'],
  ['tut.plant.title', '再种一颗', '再種一顆', 'Plant another seed', 'もう一粒まく', '씨앗 하나 더'],
  ['tut.plant.body', '选一颗种子，种到空地上。', '選一顆種子，種到空地上。', 'Pick a seed and plant it on open soil.', '種を選んで空いた畑にまきます。', '씨앗을 골라 빈 밭에 심으세요.'],
  ['tut.water.title', '给它浇一次水', '給它澆一次水', 'Water it once', '一度だけ水をやる', '한 번 물 주기'],
  ['tut.water.body', '点正在生长的作物，再点一次浇水。', '點正在生長的作物，再點一次澆水。', 'Tap a growing crop, then tap again to water it.', '育っている作物をタップし、もう一度で水やり。', '자라는 작물을 누르고, 한 번 더 눌러 물을 주세요.'],
  ['tut.checklist.title', '明早有一张清单', '明早有一張清單', 'Tomorrow has a short list', '明朝の短いリスト', '내일 아침의 짧은 목록'],
  ['tut.checklist.body', '收获、播种、浇水、看一眼节日、登录。五项都做完，连续天数会加一。', '收穫、播種、澆水、看一眼節日、登入。五項都做完，連續天數會加一。', 'Harvest, plant, water, glance at the festival, and log in. Finish all five and the streak grows.', '収穫、種まき、水やり、お祭りをちらっと、ログイン。五つそろうと連続日数が増えます。', '수확, 심기, 물 주기, 축제 살펴보기, 접속. 다섯을 마치면 연속 기록이 늘어요.'],
  ['tut.login.title', '七天的小礼物', '七天的小禮物', 'Seven small gifts', '七日間の小さな贈り物', '7일의 작은 선물'],
  ['tut.login.body', '登录奖励按这台设备的本地日期，一天一份。中断会从第一天重新数。', '登入獎勵按這台裝置的本地日期，一天一份。中斷會從第一天重新數。', 'Login gifts follow this device’s local date, one each day. A missed day starts again at day one.', 'ログイン報酬はこの端末の現地日付で、1日1回。欠かすと1日目から数え直します。', '접속 선물은 이 기기의 현지 날짜로 하루에 하나. 빠지면 1일부터 다시 세요.'],
  ['tut.hooks.title', '明天也可以回来', '明天也可以回來', 'Come back tomorrow', '明日もまた来てね', '내일도 와도 좋아요'],
  ['tut.hooks.body', '晨间清单、登录礼物、邻居周委托和明日订单都在日程里。天气神社的祝福只在当天有效。', '晨間清單、登入禮物、鄰居週委託和明日訂單都在日程裡。天氣神社的祝福只在當天有效。', 'The morning list, login gift, neighbor week errands, and tomorrow’s order all live in Today. A shrine blessing lasts only until local midnight.', '朝のリスト、ログインの贈り物、近所の週の頼み、明日の注文は「日程」にあります。神社の祝福はその日だけ。', '아침 목록, 접속 선물, 이웃의 주간 부탁, 내일 주문은 ‘오늘’에 있어요. 신사 축복은 그날까지만이에요.'],
  ['tut.skip', '跳过引导', '跳過引導', 'Skip', 'スキップ', '건너뛰기'],
  ['tut.next', '继续', '繼續', 'Continue', 'つづき', '계속'],
  ['tut.done', '引导已经结束', '引導已經結束', 'The intro is already finished', '案内は終わっています', '안내는 이미 끝났어요'],
  ['tut.finished', '引导完成。明天可以续晨间清单、领登录礼物，也可以接下明日订单。', '引導完成。明天可以續晨間清單、領登入禮物，也可以接下明日訂單。', 'Intro complete. Tomorrow you can keep the morning list, claim the login gift, or accept an order for the next day.', '案内完了。明日は朝のリスト、ログインの贈り物、翌日の注文が待っています。', '안내를 마쳤어요. 내일은 아침 목록, 접속 선물, 다음 날 주문을 이어서 할 수 있어요.'],
  ['tut.skipped', '已跳过。明天的晨间清单、登录礼物和明日订单都还在。', '已跳過。明天的晨間清單、登入禮物和明日訂單都還在。', 'Skipped. The morning list, login gift, and tomorrow’s order will still be here.', 'スキップしました。朝のリストもログインの贈り物も、明日の注文も残っています。', '건너뛰었어요. 아침 목록, 접속 선물, 내일 주문은 그대로 남아요.'],
  ['tut.hook1', '明早打开日程，做完五项清单就能把连续天数续上。', '明早打開日程，做完五項清單就能把連續天數續上。', 'Open Today tomorrow morning and finish the five items to keep the streak.', '明朝「日程」を開いて五つを終えると連続日数が続きます。', '내일 아침 ‘오늘’을 열고 다섯 가지를 마치면 연속 기록이 이어져요.'],
  ['tut.hook2', '登录礼物按本地日期一天一次，第七天更厚一点。', '登入禮物按本地日期一天一次，第七天更厚一點。', 'The login gift is once per local day, with a fuller gift on day seven.', 'ログインの贈り物は現地日付で1日1回。7日目は少し豪華です。', '접속 선물은 현지 날짜로 하루에 한 번, 7일째는 조금 더 두툼해요.'],
  ['tut.hook3', '邻居的周委托只记在这台设备上，不用联机。', '鄰居的週委託只記在這台裝置上，不用連線。', 'Neighbor errands stay on this device. Nothing is online.', '近所の週の頼みはこの端末だけ。ネット対戦はありません。', '이웃의 주간 부탁은 이 기기에만 남고, 온라인은 아니에요.'],
  ['tut.hook4', '今晚可以接下明日订单，明天再交货。神社祝福当天结束。', '今晚可以接下明日訂單，明天再交貨。神社祝福當天結束。', 'Accept tomorrow’s order tonight and deliver it the next day. Shrine blessings end at local midnight.', '今夜、明日の注文を受けて翌日に届けられます。神社の祝福はその日限り。', '오늘 밤에 내일 주문을 받고 다음 날 넘기세요. 신사 축복은 자정에 끝나요.'],
  ['check.title', '晨间清单', '晨間清單', 'Morning list', '朝のリスト', '아침 목록'],
  ['check.harvest', '收获一次', '收穫一次', 'Harvest once', '一度収穫', '한 번 수확'],
  ['check.plant', '播种一次', '播種一次', 'Plant once', '一度種まき', '한 번 심기'],
  ['check.water', '浇水一次', '澆水一次', 'Water once', '一度水やり', '한 번 물 주기'],
  ['check.festival', '看一眼节日', '看一眼節日', 'Glance at the festival', 'お祭りを見る', '축제 살펴보기'],
  ['check.login', '今天登录', '今天登入', 'Log in today', '今日のログイン', '오늘 접속'],
  ['check.claim', '收下今日份', '收下今日份', 'Claim today', '今日の分をもらう', '오늘의 보상'],
  ['check.done', '今天的清单已经收下', '今天的清單已經收下', 'Today’s list is already claimed', '今日のリストは受け取り済み', '오늘의 목록은 이미 받았어요'],
  ['check.need', '五项都做完再来领', '五項都做完再來領', 'Finish all five first', '五つ終えてから受け取ってね', '다섯을 마친 뒤에 받으세요'],
  ['check.streak', '连续 {n} 天', '連續 {n} 天', '{n} day streak', '{n}日連続', '{n}일 연속'],
  ['check.glance', '看看今日节日', '看看今日節日', 'Mark the festival glance', 'お祭りを確認', '축제 확인'],
  ['check.glanced', '已记下今天的节日', '已記下今天的節日', 'Festival glance noted', '今日のお祭りを確認した', '오늘 축제를 확인했어요'],
  ['check.paid', '晨间清单完成 · {coins}金币 · 连续{n}天', '晨間清單完成 · {coins}金幣 · 連續{n}天', 'Morning list complete · {coins} coins · {n} days', '朝のリスト完了 · {coins}コイン · {n}日連続', '아침 목록 완료 · 코인 {coins} · {n}일 연속'],
  ['login.title', '七日登录', '七日登入', 'Seven-day login', '7日ログイン', '7일 접속'],
  ['login.claim', '领取第 {n} 天', '領取第 {n} 天', 'Claim day {n}', '{n}日目をもらう', '{n}일차 받기'],
  ['login.today', '今天已经领过', '今天已經領過', 'Already claimed today', '今日は受け取り済み', '오늘은 이미 받았어요'],
  ['login.paid', '第 {n} 天的礼物已收下', '第 {n} 天的禮物已收下', 'Day {n} gift claimed', '{n}日目の贈り物を受け取った', '{n}일차 선물을 받았어요'],
  ['login.hint', '按这台设备的本地日期计算。缺一天会从第 1 天重数。没有服务器。', '按這台裝置的本地日期計算。缺一天會從第 1 天重數。沒有伺服器。', 'Counted on this device’s local date. A missed day restarts at day 1. No server.', 'この端末の現地日付で数えます。1日欠けると1日目から。サーバーはありません。', '이 기기의 현지 날짜로 세요. 하루를 빠지면 1일부터입니다. 서버는 없어요.'],
  ['ach.title', '勋章墙', '勳章牆', 'Medal wall', 'メダルの壁', '메달 벽'],
  ['ach.claim', '领取勋章', '領取勳章', 'Claim medal', 'メダルをもらう', '메달 받기'],
  ['ach.have', '已挂上勋章', '已掛上勳章', 'Medal hung', 'メダルを飾った', '메달을 걸었어요'],
  ['ach.locked', '还差一点', '還差一點', 'Not yet', 'まだ少し', '아직이에요'],
  ['ach.paid', '勋章收下了 · {coins}金币', '勳章收下了 · {coins}金幣', 'Medal claimed · {coins} coins', 'メダルを受け取った · {coins}コイン', '메달을 받았어요 · 코인 {coins}'],
  ['ach.harvest-1.name', '第一把麦穗', '第一把麥穗', 'First sheaf', '最初の麦束', '첫 밀단'],
  ['ach.harvest-30.name', '熟练农人', '熟練農人', 'Practiced farmer', '慣れた農夫', '익숙한 농부'],
  ['ach.water-10.name', '细心浇灌', '細心澆灌', 'Careful watering', '丁寧な水やり', '정성껏 물 주기'],
  ['ach.streak-3.name', '三日清晨', '三日清晨', 'Three mornings', '三つの朝', '사흘 아침'],
  ['ach.streak-7.name', '一周不落', '一週不落', 'A full week', '一週間', '한 주'],
  ['ach.login-7.name', '七日之约', '七日之約', 'Seven-day promise', '七日の約束', '7일의 약속'],
  ['ach.codex-8.name', '口袋图鉴', '口袋圖鑑', 'Pocket codex', 'ポケット図鑑', '주머니 도감'],
  ['ach.cook-1.name', '上过赛桌', '上過賽桌', 'Served at the contest', '競技の食卓', '대회 식탁'],
  ['ach.neighbor-1.name', '邻里的一周', '鄰里的一週', 'A neighbor’s week', '近所の一週間', '이웃의 한 주'],
  ['ach.soil-red.name', '红土地', '紅土地', 'Red soil', '赤土', '붉은 흙'],
  ['ach.explore-1.name', '走到一层之外', '走到一層之外', 'Past the first layer', '一層の向こう', '한 층 너머'],
  ['ach.decor-40.name', '好看的院子', '好看的院子', 'A good-looking yard', 'きれいな庭', '보기 좋은 마당'],
  ['codex.title', '收集图鉴', '收集圖鑑', 'Codex', '図鑑', '도감'],
  ['codex.crops', '作物', '作物', 'Crops', '作物', '작물'],
  ['codex.animals', '动物', '動物', 'Animals', '動物', '동물'],
  ['codex.furniture', '家具', '家具', 'Furniture', '家具', '가구'],
  ['codex.layers', '探索层', '探索層', 'Explore layers', '探索の層', '탐험 층'],
  ['codex.claim', '收下图鉴礼', '收下圖鑑禮', 'Claim codex gift', '図鑑のごほうび', '도감 선물'],
  ['codex.paid', '图鉴礼 · {coins}金币', '圖鑑禮 · {coins}金幣', 'Codex gift · {coins} coins', '図鑑のごほうび · {coins}コイン', '도감 선물 · 코인 {coins}'],
  ['codex.have', '这份已经收下', '這份已經收下', 'Already claimed', '受け取り済み', '이미 받았어요'],
  ['cook.title', '厨赛与配方', '廚賽與配方', 'Cooking contest', '料理大会', '요리 대회'],
  ['cook.reveal', '花费 40 金币揭开一张配方', '花費 40 金幣揭開一張配方', 'Spend 40 coins to reveal a recipe', '40コインでレシピを一枚', '코인 40으로 요리법 하나'],
  ['cook.enter', '用这份参赛', '用這份參賽', 'Enter this dish', 'この料理でエントリー', '이 요리로 참가'],
  ['cook.locked', '还没发现', '還沒發現', 'Not discovered', '未発見', '아직 모름'],
  ['cook.today', '今天已经上过赛桌', '今天已經上過賽桌', 'Already entered today', '今日はエントリー済み', '오늘은 이미 참가했어요'],
  ['cook.need', '材料还不够', '材料還不夠', 'Not enough ingredients', '材料が足りない', '재료가 부족해요'],
  ['cook.paid', '参赛得分 {score}', '參賽得分 {score}', 'Contest score {score}', '得点 {score}', '대회 점수 {score}'],
  ['cook.none', '能揭开的配方都已在手边', '能揭開的配方都已在手邊', 'No more recipes to reveal at your level', '今のレベルで開けられるレシピはない', '지금 레벨에서 열 요리법은 없어요'],
  ['cook.coins', '揭开配方需要 40 金币', '揭開配方需要 40 金幣', 'Revealing a recipe costs 40 coins', 'レシピを開くには40コイン', '요리법을 열려면 코인 40'],
  ['shrine.title', '天气神社', '天氣神社', 'Weather shrine', '天候の神社', '날씨 신사'],
  ['shrine.sprout', '发芽：今天播种快一成', '發芽：今天播種快一成', 'Sprout: crops planted today grow 10% faster', '発芽：今日まいた作物が1割速い', '싹: 오늘 심은 작물이 10% 빨라요'],
  ['shrine.bounty', '丰饶：今天每次收获 +3 金币', '豐饒：今天每次收穫 +3 金幣', 'Bounty: +3 coins on each harvest today', '豊穣：今日の収穫ごとに+3コイン', '풍요: 오늘 수확마다 코인 +3'],
  ['shrine.drizzle', '细雨：今天浇水再缩短一成', '細雨：今天澆水再縮短一成', 'Drizzle: watering today cuts another 10%', '細雨：今日の水やりがさらに1割短い', '가랑비: 오늘 물 주기가 10% 더 짧아져요'],
  ['shrine.glow', '微光：今天每次收获 +1 经验', '微光：今天每次收穫 +1 經驗', 'Glow: +1 xp on each harvest today', '微光：今日の収穫ごとに経験+1', '잔광: 오늘 수확마다 경험 +1'],
  ['shrine.pick', '请来这份祝福', '請來這份祝福', 'Ask for this blessing', 'この祝福を願う', '이 축복을 청하기'],
  ['shrine.have', '今天的祝福已经选定，本地午夜结束', '今天的祝福已經選定，本地午夜結束', 'Today’s blessing is chosen. It ends at local midnight.', '今日の祝福は決定済み。現地の深夜で終わります。', '오늘의 축복은 정해졌어요. 현지 자정에 끝나요.'],
  ['shrine.paid', '神社记下了今天的祝福', '神社記下了今天的祝福', 'The shrine noted today’s blessing', '神社が今日の祝福を記した', '신사가 오늘의 축복을 적었어요'],
  ['neighbor.title', '邻居的一周', '鄰居的一週', 'Neighbor week', '近所の一週間', '이웃의 한 주'],
  ['neighbor.note', '委托只存在这台设备上。没有好友列表，也没有联机。', '委託只存在這台裝置上。沒有好友列表，也沒有連線。', 'Errands stay on this device. There is no friend list and no online play.', '頼みはこの端末だけ。友だちリストもオンラインもありません。', '부탁은 이 기기에만 있어요. 친구 목록도 온라인도 없습니다.'],
  ['neighbor.claim', '交付委托', '交付委託', 'Turn in', '届ける', '전달'],
  ['neighbor.paid', '{name}收下了委托', '{name}收下了委託', '{name} accepted the errand', '{name}が頼みを受け取った', '{name}이 부탁을 받았어요'],
  ['neighbor.need', '还没做完', '還沒做完', 'Not finished yet', 'まだ終わっていない', '아직 덜 했어요'],
  ['neighbor.harvest', '本周收获 {n} 次', '本週收穫 {n} 次', 'Harvest {n} times this week', '今週 {n} 回収穫', '이번 주 수확 {n}번'],
  ['neighbor.water', '本周浇水 {n} 次', '本週澆水 {n} 次', 'Water {n} times this week', '今週 {n} 回水やり', '이번 주 물 주기 {n}번'],
  ['neighbor.deliver', '本周交付 {n} 张订单', '本週交付 {n} 張訂單', 'Deliver {n} orders this week', '今週 {n} 件の注文', '이번 주 주문 {n}건'],
  ['tomorrow.title', '明日订单', '明日訂單', 'Tomorrow’s order', '明日の注文', '내일의 주문'],
  ['tomorrow.note', '今晚收下，明天再送。错过明天这张单会作废。', '今晚收下，明天再送。錯過明天這張單會作廢。', 'Accept tonight, deliver tomorrow. Miss the day and the slip expires.', '今夜受けて、明日届ける。その日を過ぎると無効。', '오늘 밤에 받고 내일 전달. 그날을 넘기면 사라져요.'],
  ['tomorrow.accept', '今晚收下', '今晚收下', 'Accept tonight', '今夜受ける', '오늘 밤 수락'],
  ['tomorrow.deliver', '今天送达', '今天送達', 'Deliver today', '今日届ける', '오늘 전달'],
  ['tomorrow.wait', '明天再送去', '明天再送去', 'Deliver tomorrow', '明日届けてね', '내일 전달해요'],
  ['tomorrow.held', '这张单已经收下了', '這張單已經收下了', 'This slip is already accepted', 'この注文は受け取り済み', '이 주문은 이미 받았어요'],
  ['tomorrow.paid', '明日订单送达 · {coins}金币', '明日訂單送達 · {coins}金幣', 'Tomorrow’s order delivered · {coins} coins', '明日の注文を届けた · {coins}コイン', '내일의 주문을 전달 · 코인 {coins}'],
  ['tomorrow.short', '材料还没备齐', '材料還沒備齊', 'Ingredients are short', '材料が足りない', '재료가 모자라요'],
  ['tomorrow.missed', '这张单过了明天，已经作废', '這張單過了明天，已經作廢', 'The day passed. This slip expired.', '日付を過ぎたので無効になりました', '날짜가 지나 주문이 사라졌어요'],
  ['tomorrow.empty', '先收下今晚的单', '先收下今晚的單', 'Accept tonight’s slip first', '今夜の注文を先に受けて', '오늘 밤 주문부터 받으세요'],
  ['title.wall', '连收称号', '連收稱號', 'Harvest titles', '連日収穫の称号', '연속 수확 칭호'],
  ['title.till-3', '三日勤耕', '三日勤耕', 'Three days tilling', '三日の耕作', '사흘 경작'],
  ['title.till-7', '七日不辍', '七日不輟', 'Seven days unceasing', '七日の継続', '이레 쉬지 않음'],
  ['title.till-14', '半月晴耕', '半月晴耕', 'A fortnight of clear tilling', '半月の晴耕', '보름 맑은 경작'],
  ['title.till-30', '四季不断', '四季不斷', 'Through the seasons', '四季を通して', '사계절 내내'],
  ['soil.normal', '普通土地', '普通土地', 'Plain soil', '普通の土', '보통 흙'],
  ['soil.black', '黑土地', '黑土地', 'Black soil', '黒土', '검은 흙'],
  ['soil.red', '红土地', '紅土地', 'Red soil', '赤土', '붉은 흙'],
  ['soil.locked', '先开垦这块田地', '先開墾這塊田地', 'Clear this plot first', '先にこの畑を開墾して', '먼저 이 밭을 개간하세요'],
  ['soil.flood', '田里还有积水，先疏通再改良', '田裡還有積水，先疏通再改良', 'Drain the floodwater before upgrading', '水たまりを通してから改良して', '고인 물을 뺀 뒤에 개량하세요'],
  ['soil.max', '红土地已是最高级', '紅土地已是最高級', 'Red soil is the top tier', '赤土が最高です', '붉은 흙이 가장 높아요'],
  ['soil.coins', '金币不足，升级{name}需要{coins}金币', '金幣不足，升級{name}需要{coins}金幣', 'Not enough coins. {name} costs {coins}.', 'コインが足りません。{name}には{coins}コイン。', '코인이 부족해요. {name}은 {coins} 코인.'],
  ['soil.feed', '饲料不足，升级{name}需要饲料×{feed}', '飼料不足，升級{name}需要飼料×{feed}', 'Not enough feed. {name} needs feed ×{feed}.', '飼料が足りません。{name}には飼料×{feed}。', '사료가 부족해요. {name}은 사료 ×{feed}.'],
  ['soil.done', '{name}改良完成 · 生长{growth} · 浇水缩短{water}', '{name}改良完成 · 生長{growth} · 澆水縮短{water}', '{name} ready · growth {growth} · water {water}', '{name}に改良 · 成長{growth} · 水やり{water}', '{name} 개량 · 성장 {growth} · 물 {water}'],
  ['soil.batch', '一键改良了 {n} 块田', '一鍵改良了 {n} 塊田', 'Upgraded {n} plots in one tap', '{n}枚の畑をまとめて改良', '한 번에 {n}칸을 개량했어요'],
  ['soil.batchNone', '没有可以改良的田', '沒有可以改良的田', 'No plots can be upgraded', '改良できる畑がない', '개량할 밭이 없어요'],
  ['soil.batchBtn', '一键改良土壤', '一鍵改良土壤', 'Upgrade soil', '土をまとめて改良', '흙 한 번에 개량'],
  ['soil.hint', '主农场自带土壤等级：普通、黑土、红土。花费和生长与单独升级相同，已种下的作物不改时间。', '主農場自帶土壤等級：普通、黑土、紅土。花費和生長與單獨升級相同，已種下的作物不改時間。', 'Soil tiers live in this build: plain, black, red. Cost and growth match a single upgrade. Crops already planted keep their timer.', '土壌は普通・黒土・赤土。費用と成長は1枚ずつの改良と同じ。植え済みの作物の時間は変わりません。', '흙은 보통, 검은 흙, 붉은 흙. 비용과 성장은 한 칸 개량과 같고, 이미 심은 작물 시간은 그대로예요.'],
  ['share.ios', '已打开系统分享', '已打開系統分享', 'Opened the system share sheet', '共有シートを開いた', '시스템 공유를 열었어요'],
  ['share.web', '已打开分享', '已打開分享', 'Share sheet opened', '共有を開いた', '공유를 열었어요'],
  ['share.copy', '链接已复制，卡片也已保存', '連結已複製，卡片也已保存', 'Link copied and card saved', 'リンクをコピーし、カードも保存した', '링크를 복사하고 카드도 저장했어요'],
  ['share.saved', '分享卡片已保存', '分享卡片已保存', 'Share card saved', '共有カードを保存した', '공유 카드를 저장했어요'],
  ['share.cancel', '已取消分享', '已取消分享', 'Share cancelled', '共有をキャンセルした', '공유를 취소했어요'],
  ['share.fail', '这台设备没法分享，邀请码仍可亲手告诉朋友', '這台裝置沒法分享，邀請碼仍可親手告訴朋友', 'This device cannot open a share sheet. You can still read the code to a friend.', 'この端末では共有シートを開けません。コードは口頭で伝えられます。', '이 기기에서는 공유 시트를 열 수 없어요. 코드는 직접 알려 주세요.'],
  ['share.inviteTitle', '来晴野坐坐', '來晴野坐坐', 'Come sit in Sunny Meadow', '晴野に遊びに来て', '청야에 앉아 봐요'],
  ['share.inviteBody', '我在玩单机的《晴野物语》：种田、做饭、布置院子，不用联机。邀请码 {code} 可以在朋友自己的设备上换一份小小的新手礼物。这不是在线房间，也没有好友列表。', '我在玩單機的《晴野物語》：種田、做飯、佈置院子，不用連線。邀請碼 {code} 可以在朋友自己的裝置上換一份小小的新手禮物。這不是線上房間，也沒有好友列表。', 'I am playing Sunny Meadow offline: crops, cooking, and a yard to decorate. No online play. Code {code} redeems a small starter gift on a friend’s own device. It is not a live room and there is no friend list.', 'オフラインの『晴野物語』で、作物と料理と庭を楽しんでいます。オンライン対戦はありません。コード {code} は友だちの端末で小さな初期ギフトに換えられます。ルームでも友だちリストでもありません。', '오프라인 《청야 이야기》에서 농사와 요리, 마당을 가꾸고 있어요. 온라인은 없어요. 코드 {code}는 친구 기기에서 작은 시작 선물로 바뀝니다. 온라인 방도 친구 목록도 아니에요.'],
  ['share.offlineNote', '单机小农场 · 不联机', '單機小農場 · 不連線', 'A cozy offline farm', 'オフラインの小さな農場', '아늑한 오프라인 농장'],
  ['share.card.first-harvest', '收下了晴野的第一把麦子', '收下了晴野的第一把麥子', 'Took the first sheaf in Sunny Meadow', '晴野で最初の麦を収穫した', '청야에서 첫 밀을 거뒀어요'],
  ['share.card.decor', '院子布置刷新了自己的最好成绩：{score}分', '院子佈置刷新了自己的最好成績：{score}分', 'New personal best for the yard: {score}', '庭の自己ベストを更新：{score}点', '마당 개인 최고를 새로 썼어요: {score}점'],
  ['share.card.festival', '节日小赛拿到 {score} 分', '節日小賽拿到 {score} 分', 'Festival game score: {score}', 'お祭りの得点 {score}', '축제 점수 {score}'],
  ['share.card.streak', '连续照顾农场 {score} 天', '連續照顧農場 {score} 天', 'Looked after the farm for {score} days', '農場を{score}日続けて世話した', '농장을 {score}일 연속으로 돌봤어요'],
  ['share.card.red-soil', '把一块田养成了红土地', '把一塊田養成了紅土地', 'Raised a plot to red soil', '畑を赤土まで育てた', '밭 하나를 붉은 흙까지 키웠어요'],
  ['share.card.recipe', '揭开了新配方：{name}', '揭開了新配方：{name}', 'Unlocked a recipe: {name}', '新しいレシピ：{name}', '새 요리법: {name}'],
  ['share.card.codex', '图鉴到了一个新的台阶：{name}', '圖鑑到了一個新的台階：{name}', 'Codex reached {name}', '図鑑が「{name}」に届いた', '도감이 {name}에 닿았어요'],
  ['share.redeem.ok', '邀请码兑换成功 · 金币 +40 · 小麦 +2 · 农场星 +1。这只是本机的新手礼物，不能证明朋友已安装，也不会记到邀请人身上。', '邀請碼兌換成功 · 金幣 +40 · 小麥 +2 · 農場星 +1。這只是本機的新手禮物，不能證明朋友已安裝，也不會記到邀請人身上。', 'Code redeemed · +40 coins · wheat +2 · 1 star. This is a local starter gift. It does not prove a friend installed the game, and the inviter is not paid.', 'コードを交換しました · コイン+40 · 小麦+2 · 星+1。これは端末内の初期ギフトで、友だちのインストール証明にはならず、招待した人へは届きません。', '코드를 바꿨어요 · 코인 +40 · 밀 +2 · 별 +1. 이 기기의 시작 선물일 뿐, 친구가 설치했다는 증거가 아니고 초대한 사람에게 돌아가지 않아요.'],
  ['share.redeem.bad', '这串邀请码对不上', '這串邀請碼對不上', 'That code does not match', 'そのコードは一致しません', '코드가 맞지 않아요'],
  ['share.redeem.own', '这是你自己的邀请码', '這是你自己的邀請碼', 'That is your own code', 'それは自分のコードです', '그건 내 코드예요'],
  ['share.redeem.used', '这台设备已经兑换过一份新手礼物', '這台裝置已經兌換過一份新手禮物', 'This device already redeemed a starter gift', 'この端末では初期ギフトを交換済み', '이 기기는 시작 선물을 이미 받았어요'],
  ['codex.crops-4', '作物四种', '作物四種', 'Four crops', '作物4種', '작물 네 가지'],
  ['codex.crops-8', '作物八种', '作物八種', 'Eight crops', '作物8種', '작물 여덟 가지'],
  ['codex.crops-16', '作物十六种', '作物十六種', 'Sixteen crops', '作物16種', '작물 열여섯 가지'],
  ['codex.animals-3', '三种动物', '三種動物', 'Three animals', '動物3種', '동물 세 종류'],
  ['codex.animals-8', '八种动物', '八種動物', 'Eight animals', '動物8種', '동물 여덟 종류'],
  ['codex.furniture-3', '三件家具', '三件家具', 'Three pieces of furniture', '家具3つ', '가구 세 점'],
  ['codex.layers-1', '第一层探索', '第一層探索', 'First explore layer', '探索の第一層', '탐험 첫 층'],
  ['codex.layers-4', '四处都走过一层', '四處都走過一層', 'A layer in four places', '四つの場所で一層', '네 곳에서 한 층'],
];

const itemRows: Row[] = [
  ['item.wheat', '小麦', '小麥', 'Wheat', '小麦', '밀'],
  ['item.carrot', '胡萝卜', '胡蘿蔔', 'Carrot', 'ニンジン', '당근'],
  ['item.tomato', '番茄', '番茄', 'Tomato', 'トマト', '토마토'],
  ['item.strawberry', '草莓', '草莓', 'Strawberry', 'イチゴ', '딸기'],
  ['item.corn', '玉米', '玉米', 'Corn', 'トウモロコシ', '옥수수'],
  ['item.pumpkin', '南瓜', '南瓜', 'Pumpkin', 'カボチャ', '호박'],
  ['item.rice', '水稻', '水稻', 'Rice', '米', '벼'],
  ['item.potato', '土豆', '馬鈴薯', 'Potato', 'ジャガイモ', '감자'],
  ['item.cabbage', '卷心菜', '高麗菜', 'Cabbage', 'キャベツ', '양배추'],
  ['item.cucumber', '黄瓜', '黃瓜', 'Cucumber', 'キュウリ', '오이'],
  ['item.soybean', '大豆', '大豆', 'Soybean', '大豆', '콩'],
  ['item.cotton', '棉花', '棉花', 'Cotton', '綿花', '목화'],
  ['item.sugarcane', '甘蔗', '甘蔗', 'Sugarcane', 'サトウキビ', '사탕수수'],
  ['item.watermelon', '西瓜', '西瓜', 'Watermelon', 'スイカ', '수박'],
  ['item.grape', '葡萄', '葡萄', 'Grape', 'ブドウ', '포도'],
  ['item.orange', '橙子', '橙子', 'Orange', 'オレンジ', '오렌지'],
  ['item.sunflowerCrop', '油葵', '油葵', 'Sunflower', 'ヒマワリ', '해바라기'],
  ['item.cocoa', '可可', '可可', 'Cocoa', 'カカオ', '카카오'],
  ['item.coffee', '咖啡', '咖啡', 'Coffee', 'コーヒー', '커피'],
  ['item.lavender', '薰衣草', '薰衣草', 'Lavender', 'ラベンダー', '라벤더'],
  ['item.auroraBerry', '极光莓', '極光莓', 'Aurora berry', 'オーロラベリー', '오로라베리'],
  ['item.goldenPumpkin', '黄金南瓜', '黃金南瓜', 'Golden pumpkin', '黄金カボチャ', '황금호박'],
  ['item.egg', '鸡蛋', '雞蛋', 'Egg', '卵', '달걀'],
  ['item.milk', '牛奶', '牛奶', 'Milk', '牛乳', '우유'],
  ['item.bread', '麦香面包', '麥香麵包', 'Wheat bread', '麦のパン', '밀빵'],
  ['item.cheese', '农场奶酪', '農場起司', 'Farm cheese', '農場チーズ', '농장 치즈'],
  ['item.jam', '草莓果酱', '草莓果醬', 'Strawberry jam', 'イチゴジャム', '딸기잼'],
  ['item.pie', '南瓜派', '南瓜派', 'Pumpkin pie', 'カボチャパイ', '호박파이'],
  ['item.fish', '溪流鱼', '溪流魚', 'Stream fish', '川魚', '시내 물고기'],
  ['item.goldenFish', '金色锦鲤', '金色錦鯉', 'Golden koi', '金色の鯉', '황금 잉어'],
  ['item.apple', '苹果', '蘋果', 'Apple', 'リンゴ', '사과'],
  ['item.honey', '蜂蜜', '蜂蜜', 'Honey', 'はちみつ', '꿀'],
  ['item.orchardBasket', '果园礼篮', '果園禮籃', 'Orchard basket', '果樹園のギフト', '과수원 바구니'],
  ['item.flour', '面粉', '麵粉', 'Flour', '小麦粉', '밀가루'],
  ['item.feed', '饲料', '飼料', 'Feed', '飼料', '사료'],
  ['item.wool', '羊毛', '羊毛', 'Wool', '羊毛', '양털'],
  ['item.truffle', '松露', '松露', 'Truffle', 'トリュフ', '트러플'],
  ['item.goatMilk', '羊奶', '羊奶', 'Goat milk', 'ヤギ乳', '염소젖'],
  ['item.duckEgg', '鸭蛋', '鴨蛋', 'Duck egg', 'アヒルの卵', '오리알'],
  ['item.fur', '兔绒', '兔絨', 'Rabbit fluff', 'うさぎの毛', '토끼털'],
  ['item.feather', '孔雀羽', '孔雀羽', 'Peacock feather', '孔雀の羽', '공작 깃털'],
  ['item.butter', '黄油', '奶油', 'Butter', 'バター', '버터'],
  ['item.yogurt', '酸奶', '優格', 'Yogurt', 'ヨーグルト', '요거트'],
  ['item.appleJuice', '苹果汁', '蘋果汁', 'Apple juice', 'リンゴジュース', '사과주스'],
  ['item.orangeJuice', '橙汁', '橙汁', 'Orange juice', 'オレンジジュース', '오렌지주스'],
  ['item.grapeJuice', '葡萄汁', '葡萄汁', 'Grape juice', 'ブドウジュース', '포도주스'],
  ['item.cloth', '棉布', '棉布', 'Cloth', '綿布', '면직물'],
  ['item.clothes', '衣服', '衣服', 'Clothes', '服', '옷'],
  ['item.sugar', '蔗糖', '蔗糖', 'Sugar', '砂糖', '설탕'],
  ['item.chocolate', '巧克力', '巧克力', 'Chocolate', 'チョコレート', '초콜릿'],
  ['item.candy', '糖果', '糖果', 'Candy', 'キャンディ', '사탕'],
  ['item.vinegar', '果醋', '果醋', 'Fruit vinegar', '果実酢', '과일 식초'],
  ['item.planks', '木板', '木板', 'Planks', '板材', '판자'],
  ['item.fruitCan', '水果罐头', '水果罐頭', 'Fruit can', 'フルーツ缶', '과일 통조림'],
  ['item.vegCan', '蔬菜罐头', '蔬菜罐頭', 'Vegetable can', '野菜缶', '채소 통조림'],
  ['item.cake', '浆果蛋糕', '漿果蛋糕', 'Berry cake', 'ベリーケーキ', '베리 케이크'],
  ['item.cookies', '曲奇', '餅乾', 'Cookies', 'クッキー', '쿠키'],
  ['item.wood', '木材', '木材', 'Wood', '木材', '목재'],
  ['item.ore', '铜矿', '銅礦', 'Copper ore', '銅鉱石', '구리 광석'],
  ['item.coal', '煤炭', '煤炭', 'Coal', '石炭', '석탄'],
  ['item.gem', '蓝宝石', '藍寶石', 'Sapphire', 'サファイア', '사파이어'],
  ['item.herb', '香草', '香草', 'Herb', 'ハーブ', '허브'],
  ['item.ice', '冰晶', '冰晶', 'Ice crystal', '氷晶', '얼음 결정'],
  ['item.rainbowMilk', '彩虹奶', '彩虹奶', 'Rainbow milk', '虹色のミルク', '무지개 우유'],
  ['item.goldenWool', '黄金羊毛', '黃金羊毛', 'Golden wool', '黄金の羊毛', '황금 양털'],
  ['item.carp', '鲤鱼', '鯉魚', 'Carp', 'コイ', '잉어'],
  ['item.crucian', '鲫鱼', '鯽魚', 'Crucian carp', 'フナ', '붕어'],
  ['item.bass', '鲈鱼', '鱸魚', 'Bass', 'スズキ', '농어'],
  ['item.lobster', '龙虾', '龍蝦', 'Lobster', 'ロブスター', '랍스터'],
  ['item.crab', '螃蟹', '螃蟹', 'Crab', 'カニ', '게'],
  ['animal.hen', '母鸡', '母雞', 'Hen', 'めんどり', '암탉'],
  ['animal.cow', '奶牛', '奶牛', 'Cow', '乳牛', '젖소'],
  ['animal.duck', '鸭子', '鴨子', 'Duck', 'アヒル', '오리'],
  ['animal.sheep', '绵羊', '綿羊', 'Sheep', 'ヒツジ', '양'],
  ['animal.pig', '小猪', '小豬', 'Pig', 'ブタ', '돼지'],
  ['animal.goat', '山羊', '山羊', 'Goat', 'ヤギ', '염소'],
  ['animal.rabbit', '兔子', '兔子', 'Rabbit', 'ウサギ', '토끼'],
  ['animal.cat', '猫咪', '貓咪', 'Cat', 'ネコ', '고양이'],
  ['animal.dog', '小狗', '小狗', 'Dog', 'イヌ', '강아지'],
  ['animal.horse', '马', '馬', 'Horse', 'ウマ', '말'],
  ['animal.peacock', '孔雀', '孔雀', 'Peacock', 'クジャク', '공작'],
  ['animal.goldenSheep', '黄金羊', '黃金羊', 'Golden sheep', '黄金のヒツジ', '황금양'],
  ['animal.rainbowCow', '彩虹牛', '彩虹牛', 'Rainbow cow', '虹のウシ', '무지개 소'],
  ['animal.unicorn', '独角兽', '獨角獸', 'Unicorn', 'ユニコーン', '유니콘'],
  ['animal.goose', '鹅', '鵝', 'Goose', 'ガチョウ', '거위'],
  ['animal.turkey', '火鸡', '火雞', 'Turkey', '七面鳥', '칠면조'],
  ['animal.quail', '鹌鹑', '鵪鶉', 'Quail', 'ウズラ', '메추라기'],
  ['animal.pigeon', '鸽子', '鴿子', 'Pigeon', 'ハト', '비둘기'],
  ['animal.buffalo', '水牛', '水牛', 'Water buffalo', '水牛', '물소'],
  ['animal.hamster', '仓鼠', '倉鼠', 'Hamster', 'ハムスター', '햄스터'],
  ['animal.donkey', '驴', '驢', 'Donkey', 'ロバ', '당나귀'],
  ['animal.camel', '骆驼', '駱駝', 'Camel', 'ラクダ', '낙타'],
  ['animal.yak', '牦牛', '犛牛', 'Yak', 'ヤク', '야크'],
  ['animal.ostrich', '鸵鸟', '鴕鳥', 'Ostrich', 'ダチョウ', '타조'],
  ['animal.alpaca', '羊驼', '羊駝', 'Alpaca', 'アルパカ', '알파카'],
  ['animal.deer', '梅花鹿', '梅花鹿', 'Sika deer', 'シカ', '꽃사슴'],
  ['animal.whitePeacock', '白色孔雀', '白色孔雀', 'White peacock', '白いクジャク', '흰 공작'],
  ['furniture.bed', '绿叶小床', '綠葉小床', 'Leaf bed', '緑のベッド', '잎사귀 침대'],
  ['furniture.sofa', '暖橙沙发', '暖橙沙發', 'Warm sofa', '暖色のソファ', '따뜻한 소파'],
  ['furniture.desk', '木质书桌', '木質書桌', 'Wooden desk', '木の机', '나무 책상'],
  ['furniture.rug', '蓝色地毯', '藍色地毯', 'Blue rug', '青いラグ', '파란 러그'],
  ['furniture.housePlant', '绿叶盆栽', '綠葉盆栽', 'Potted plant', '鉢植え', '화분'],
  ['furniture.lamp', '暖光落地灯', '暖光落地燈', 'Floor lamp', 'フロアランプ', '스탠드'],
  ['furniture.bookshelf', '小书柜', '小書櫃', 'Bookshelf', '小さな本棚', '작은 책장'],
  ['story.village.title', '小镇的第一张餐桌', '小鎮的第一張餐桌', 'The town’s first table', '町の最初の食卓', '마을의 첫 식탁'],
  ['story.village.body', '阿禾打算在小镇广场支起一张早餐桌，想请你送来面包。', '阿禾打算在小鎮廣場支起一張早餐桌，想請你送來麵包。', 'Ahe wants a breakfast table on the square and asks you to bring bread.', 'アホは広場に朝食の卓を置きたいので、パンを届けてほしいと言っています。', '아허는 광장에 아침 식탁을 놓고 빵을 부탁해요.'],
  ['story.forest.title', '林间路标', '林間路標', 'A forest signpost', '林の道しるべ', '숲의 이정표'],
  ['story.forest.body', '旧路标被风吹倒了。走完森林第一层，再带木材回来把路标立起来。', '舊路標被風吹倒了。走完森林第一層，再帶木材回來把路標立起來。', 'The old sign blew over. Finish forest layer one, then bring wood to stand it up again.', '古い道しるべが倒れました。森の第一層を終えて、木材で立て直してください。', '옛 이정표가 쓰러졌어요. 숲 1층을 마치고 목재로 다시 세우세요.'],
  ['story.mine.title', '矿灯重亮', '礦燈重亮', 'The mine lamp', '坑道のランプ', '갱도의 등'],
  ['story.mine.body', '矿道尽头有盏坏掉的灯。走完矿山第二层，用铜矿修好它。', '礦道盡頭有盞壞掉的燈。走完礦山第二層，用銅礦修好它。', 'A lamp is out at the end of the shaft. Finish mine layer two and repair it with copper.', '坑道の奥のランプが壊れています。鉱山の第二層を終えて、銅鉱で直してください。', '갱도 끝의 등이 꺼졌어요. 광산 2층을 마치고 구리로 고치세요.'],
  ['story.beach.title', '码头的渔灯', '碼頭的漁燈', 'The dock lamp', '埠頭の漁り火', '부두의 등'],
  ['story.beach.body', '走完海滩第二层，再带鱼回到码头，一起吃一顿热乎乎的晚餐。', '走完海灘第二層，再帶魚回到碼頭，一起吃一頓熱乎乎的晚餐。', 'Finish beach layer two, bring fish back to the dock, and share a warm supper.', '浜辺の第二層を終えて魚を埠頭へ。温かい夕食を一緒に。', '해변 2층을 마치고 생선을 부두로 가져와 따뜻한 저녁을 나누세요.'],
  ['story.snow.title', '极光守夜人', '極光守夜人', 'The aurora watch', 'オーロラの夜番', '오로라 파수꾼'],
  ['story.snow.body', '走完雪原第三层，再给守夜人带去冰晶，换一把极光莓。', '走完雪原第三層，再給守夜人帶去冰晶，換一把極光莓。', 'Finish snow layer three, bring ice crystals to the watch, and trade for aurora berries.', '雪原の第三層を終えて氷晶を夜番へ。オーロラベリーと交換します。', '설원 3층을 마치고 얼음 결정을 파수꾼에게 주면 오로라베리로 바꿔 줘요.'],
  ['breakfast.0.title', '收下第一批小麦', '收下第一批小麥', 'Gather the first wheat', '最初の小麦を受け取る', '첫 밀을 거두기'],
  ['breakfast.0.hint', '回主农场，点击成熟的小麦。', '回主農場，點擊成熟的小麥。', 'Return to the farm and tap ripe wheat.', '農場に戻り、熟した小麦をタップ。', '농장으로 돌아가 익은 밀을 누르세요.'],
  ['breakfast.1.title', '到磨坊加工面粉', '到磨坊加工麵粉', 'Mill the flour', '製粉所で小麦粉に', '방앗간에서 밀가루'],
  ['breakfast.1.hint', '磨坊用 2 份小麦做 1 份面粉。记得领取成品。', '磨坊用 2 份小麥做 1 份麵粉。記得領取成品。', 'The mill turns 2 wheat into 1 flour. Collect the finished batch.', '製粉所は小麦2で小麦粉1。できあがったら受け取って。', '방앗간은 밀 2로 밀가루 1. 끝나면 찾아가세요.'],
  ['breakfast.2.title', '烤出第一炉面包', '烤出第一爐麵包', 'Bake the first loaf', '最初のパンを焼く', '첫 빵 굽기'],
  ['breakfast.2.hint', '面包房可用 2 份面粉制作磨坊面包，也能用小麦和鸡蛋制作麦香面包。', '麵包房可用 2 份麵粉製作磨坊麵包，也能用小麥和雞蛋製作麥香麵包。', 'The bakery can use 2 flour, or wheat and an egg, to bake bread.', 'パン屋は小麦粉2、または小麦と卵でパンを焼けます。', '빵집은 밀가루 2개, 또는 밀과 달걀로 빵을 구워요.'],
  ['breakfast.3.title', '给阿禾送去面包', '給阿禾送去麵包', 'Bring Ahe the bread', 'アホにパンを届ける', '아허에게 빵 전달'],
  ['breakfast.3.hint', '带 1 个面包交给阿禾，小镇会把早餐摆上桌。', '帶 1 個麵包交給阿禾，小鎮會把早餐擺上桌。', 'Give Ahe 1 bread and the town sets out breakfast.', 'パンを1つアホへ。町が朝食を並べます。', '빵 1개를 아허에게 주면 마을이 아침을 차려요.'],
  ['breakfast.4.title', '领走开垦补给', '領走開墾補給', 'Take the clearing supplies', '開墾の補給を受け取る', '개간 보급 받기'],
  ['breakfast.4.hint', '阿禾备好了 120 金币、3 农场星和 2 木板。', '阿禾備好了 120 金幣、3 農場星和 2 木板。', 'Ahe set aside 120 coins, 3 stars, and 2 planks.', 'アホが120コイン、星3、板材2を用意しています。', '아허가 코인 120, 별 3, 판자 2를 준비했어요.'],
  ['honor.80.name', '雪原守望者', '雪原守望者', 'Snowfield watcher', '雪原の見守り', '설원 파수'],
  ['honor.80.hint', '安全返程并完成雪原第12层', '安全返程並完成雪原第12層', 'Return safely from snow layer 12', '雪原第12層から無事に帰る', '설원 12층에서 무사히 돌아오기'],
  ['honor.90.name', '家园工匠', '家園工匠', 'Home craftsperson', '家の職人', '집의 장인'],
  ['honor.90.hint', '小屋扩到10×10，并摆放至少10件家具', '小屋擴到10×10，並擺放至少10件家具', 'Expand the cottage to 10×10 and place at least 10 pieces', '小屋を10×10にして家具を10個置く', '오두막을 10×10으로 넓히고 가구 10개를 두기'],
  ['honor.100.name', '晴野大使', '晴野大使', 'Meadow envoy', '晴野の使者', '청야 사절'],
  ['honor.100.hint', '完成全部5个地区故事，并领取前两项荣誉', '完成全部5個地區故事，並領取前兩項榮譽', 'Finish all 5 area stories and claim the first two honors', '5つの地域物語と、先の二つの栄誉', '지역 이야기 5개와 앞의 두 명예'],
  ['order.o0.person', '林奶奶', '林奶奶', 'Granny Lin', 'リンおばあさん', '린 할머니'],
  ['order.o0.message', '早上的面包，就差新鲜的麦香啦。', '早上的麵包，就差新鮮的麥香啦。', 'Morning bread still needs that fresh wheat smell.', '朝のパンに、焼きたての麦の香りが欲しいの。', '아침 빵에 신선한 밀 향이 필요해요.'],
  ['order.o1.person', '面包师阿禾', '麵包師阿禾', 'Baker Ahe', 'パン職人アホ', '빵 굽는 아허'],
  ['order.o1.message', '想用你的鸡蛋，烤一炉松软的小蛋糕。', '想用你的雞蛋，烤一爐鬆軟的小蛋糕。', 'I would like your eggs for a tray of soft little cakes.', 'あなたの卵で、ふわふわの小さなケーキを焼きたい。', '당신 달걀로 부드러운 작은 케이크를 굽고 싶어요.'],
  ['order.o2.person', '邻居小满', '鄰居小滿', 'Neighbor Xiaoman', '近所のシャオマン', '이웃 샤오만'],
  ['order.o2.message', '给家人准备一份暖暖的农场早餐。', '給家人準備一份暖暖的農場早餐。', 'A warm farm breakfast for the family, please.', '家族に温かい農場の朝食を用意したい。', '가족을 위한 따뜻한 농장 아침을 준비하고 싶어요.'],
  ['order.o3.person', '集市店长', '集市店長', 'Market keeper', '市の店主', '장터 주인'],
  ['order.o3.message', '今天的摊位需要一篮刚收下来的蔬菜。', '今天的攤位需要一籃剛收下來的蔬菜。', 'Today’s stall needs a basket of vegetables just picked.', '今日の屋台に、採れたての野菜を一かご。', '오늘 좌판에 방금 딴 채소 한 바구니가 필요해요.'],
  ['order.o4.person', '露营的朋友', '露營的朋友', 'Camping friend', 'キャンプの友人', '캠핑 친구'],
  ['order.o4.message', '带一点鸡蛋和牛奶，去草地上野餐吧。', '帶一點雞蛋和牛奶，去草地上野餐吧。', 'Bring some eggs and milk for a picnic on the grass.', '卵と牛乳を持って、草原でピクニックしましょう。', '달걀과 우유를 들고 풀밭에서 소풍해요.'],
  ['order.o5.person', '池塘边的渔友', '池塘邊的漁友', 'Fisher by the pond', '池の釣り仲間', '연못의 낚시 친구'],
  ['order.o5.message', '新鲜的鱼配上胡萝卜，今晚煮一锅鲜汤。', '新鮮的魚配上胡蘿蔔，今晚煮一鍋鮮湯。', 'Fresh fish and carrots for a pot of soup tonight.', '新鮮な魚とニンジンで、今夜はスープを。', '신선한 생선과 당근으로 오늘 밤 국을 끓여요.'],
  ['order.o6.person', '野餐的朋友', '野餐的朋友', 'Picnic friend', 'ピクニックの友人', '소풍 친구'],
  ['order.o6.message', '想带上刚出炉的面包，去草地喝杯牛奶。', '想帶上剛出爐的麵包，去草地喝杯牛奶。', 'Fresh bread and a cup of milk out on the grass.', '焼きたてパンを持って、草原で牛乳を一杯。', '갓 구운 빵을 들고 풀밭에서 우유 한 잔.'],
  ['order.o7.person', '集市小厨', '集市小廚', 'Market cook', '市の小料理', '장터 요리사'],
  ['order.o7.message', '你的农场奶酪，配蔬菜沙拉一定很棒。', '你的農場起司，配蔬菜沙拉一定很棒。', 'Your farm cheese would be wonderful with a vegetable salad.', '農場のチーズは野菜サラダにぴったり。', '농장 치즈는 채소 샐러드와 잘 어울려요.'],
  ['order.o8.person', '果酱爱好者', '果醬愛好者', 'Jam enthusiast', 'ジャム好き', '잼을 좋아하는 사람'],
  ['order.o8.message', '早餐最喜欢草莓果酱，记得留一罐给我。', '早餐最喜歡草莓果醬，記得留一罐給我。', 'Strawberry jam is my favorite breakfast. Save me a jar.', '朝ごはんはイチゴジャムが一番。一瓶残しておいて。', '아침에는 딸기잼이 최고예요. 한 병 남겨 주세요.'],
  ['order.o9.person', '丰收宴主人', '豐收宴主人', 'Harvest host', '収穫祭の主人', '수확 잔치 주인'],
  ['order.o9.message', '南瓜派和金色锦鲤，让今晚的丰收宴更热闹。', '南瓜派和金色錦鯉，讓今晚的豐收宴更熱鬧。', 'Pumpkin pie and a golden koi would brighten tonight’s harvest supper.', 'カボチャパイと金色の鯉で、今夜の収穫祭をにぎやかに。', '호박파이와 황금 잉어로 오늘 밤 수확 잔치를 북돋워요.'],
  ['order.o10.person', '果林里的朋友', '果林裡的朋友', 'Friend in the orchard', '果樹園の友人', '과수원의 친구'],
  ['order.o10.message', '带两颗新鲜苹果，再来一罐甜甜的蜂蜜。', '帶兩顆新鮮蘋果，再來一罐甜甜的蜂蜜。', 'Two fresh apples and a jar of sweet honey, please.', '新鮮なリンゴを二つと、甘いハチミツを一つ。', '신선한 사과 두 개와 달콤한 꿀 한 병.'],
  ['order.o11.person', '礼品店店长', '禮品店店長', 'Gift shop keeper', 'ギフト店の店主', '선물 가게 주인'],
  ['order.o11.message', '想把你的果园礼篮，送给远方的朋友。', '想把你的果園禮籃，送給遠方的朋友。', 'I would like to send your orchard basket to a faraway friend.', '果樹園のギフトを、遠くの友だちに送りたい。', '과수원 바구니를 먼 친구에게 보내고 싶어요.'],
  ['order.o12.person', '森林木匠', '森林木匠', 'Forest carpenter', '森の大工', '숲의 목수'],
  ['order.o12.message', '用新鲜木材和面粉，换一张暖心的订单。', '用新鮮木材和麵粉，換一張暖心的訂單。', 'Fresh wood and flour, in trade for a warm order.', '新鮮な木材と小麦粉で、温かい注文を。', '신선한 목재와 밀가루로 따뜻한 주문을.'],
  ['order.o13.person', '牧场裁缝', '牧場裁縫', 'Pasture tailor', '牧場の仕立て屋', '목장의 재봉사'],
  ['order.o13.message', '需要柔软的羊毛，给伙伴做一条围巾。', '需要柔軟的羊毛，給夥伴做一條圍巾。', 'Soft wool, please, for a scarf for a friend.', '柔らかい羊毛で、仲間のマフラーを編みます。', '부드러운 양털로 친구의 목도리를 짤게요.'],
  ['order.o14.person', '小镇早餐铺', '小鎮早餐鋪', 'Town breakfast stall', '町の朝食屋', '마을 아침 가게'],
  ['order.o14.message', '今天想供应酸奶和现烤的曲奇。', '今天想供應優格和現烤的餅乾。', 'Today’s menu is yogurt and cookies, just baked.', '今日はヨーグルトと焼きたてクッキーを出します。', '오늘은 요거트와 갓 구운 쿠키를 내놓아요.'],
  ['order.o15.person', '葡园旅人', '葡園旅人', 'Vineyard traveler', 'ぶどう園の旅人', '포도밭 나그네'],
  ['order.o15.message', '一瓶果醋，一杯葡萄汁，带着果香出发。', '一瓶果醋，一杯葡萄汁，帶著果香出發。', 'A bottle of fruit vinegar and a cup of grape juice for the road.', '果実酢を一瓶、ブドウジュースを一杯。香りを連れて出発。', '과일 식초 한 병과 포도주스 한 잔, 향을 들고 떠나요.'],
  ['order.o16.person', '节庆甜品师', '節慶甜點師', 'Festival confectioner', '祭りの菓子職人', '축제 과자 장인'],
  ['order.o16.message', '想用巧克力和糖果装点丰收节的餐桌。', '想用巧克力和糖果裝點豐收節的餐桌。', 'Chocolate and candy to dress the harvest table.', 'チョコレートとキャンディで収穫祭の卓を飾りたい。', '초콜릿과 사탕으로 수확 잔치 식탁을 꾸미고 싶어요.'],
  ['order.o17.person', '稀有动物研究员', '稀有動物研究員', 'Rare-animal researcher', '珍しい動物の研究者', '희귀 동물 연구원'],
  ['order.o17.message', '收集彩虹奶和黄金羊毛，记录小院里的奇迹。', '收集彩虹奶和黃金羊毛，記錄小院裡的奇蹟。', 'Rainbow milk and golden wool, to note the little miracles in the yard.', '虹のミルクと黄金の羊毛で、庭の奇跡を記録します。', '무지개 우유와 황금 양털로 마당의 기적을 기록해요.'],
  ['order.o18.person', '金色丰收宴', '金色豐收宴', 'Golden harvest supper', '金色の収穫宴', '황금 수확 잔치'],
  ['order.o18.message', '把黄金南瓜和极光莓做成丰收展品吧。', '把黃金南瓜和極光莓做成豐收展品吧。', 'Turn a golden pumpkin and aurora berries into a harvest display.', '黄金カボチャとオーロラベリーを収穫の飾りに。', '황금호박과 오로라베리로 수확 전시품을 만들어요.'],
  ['order.t0.person', '林奶奶', '林奶奶', 'Granny Lin', 'リンおばあさん', '린 할머니'],
  ['order.t0.message', '明天早餐想用南瓜和小麦，今晚先把单子收下吧。', '明天早餐想用南瓜和小麥，今晚先把單子收下吧。', 'Tomorrow’s breakfast needs pumpkin and wheat. Accept the slip tonight.', '明日の朝食にカボチャと小麦。今夜、注文だけ受け取って。', '내일 아침은 호박과 밀. 오늘 밤에 주문만 받아 두세요.'],
  ['order.t1.person', '面包师阿禾', '麵包師阿禾', 'Baker Ahe', 'パン職人アホ', '빵 굽는 아허'],
  ['order.t1.message', '明早的面包炉要提前备料，明天把鸡蛋和小麦送来就好。', '明早的麵包爐要提前備料，明天把雞蛋和小麥送來就好。', 'The morning oven needs supplies. Bring eggs and wheat tomorrow.', '朝の窯の仕込みです。卵と小麦は明日で大丈夫。', '아침 화덕 준비예요. 달걀과 밀은 내일 가져다 주세요.'],
  ['order.t2.person', '邻居小满', '鄰居小滿', 'Neighbor Xiaoman', '近所のシャオマン', '이웃 샤오만'],
  ['order.t2.message', '明天想做一锅热汤，今晚先记下胡萝卜和牛奶。', '明天想做一鍋熱湯，今晚先記下胡蘿蔔和牛奶。', 'A hot soup tomorrow. Note the carrots and milk tonight.', '明日は温かいスープ。ニンジンと牛乳は今夜メモして。', '내일은 따뜻한 국. 당근과 우유는 오늘 밤에 적어 두세요.'],
];

const packs: Record<Locale, Dict> = {'zh-CN': {}, 'zh-TW': {}, en: {}, ja: {}, ko: {}};
for (const [key, cn, tw, en, ja, ko] of [...rows, ...itemRows]) {
  packs['zh-CN'][key] = cn;
  if (tw) packs['zh-TW'][key] = tw;
  if (en) packs.en[key] = en;
  if (ja) packs.ja[key] = ja;
  if (ko) packs.ko[key] = ko;
}

export function t(key: string, vars: Record<string, string | number> = {}, locale?: string): string {
  const loc = isLocale(locale) ? locale : 'zh-CN';
  const raw = packs[loc][key] ?? packs['zh-CN'][key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] === undefined ? `{${name}}` : String(vars[name]));
}

export function itemName(id: string, fallback: string, locale?: string): string {
  const value = t(`item.${id}`, {}, locale);
  return value === `item.${id}` ? fallback : value;
}

export function named(prefix: string, id: string, fallback: string, locale?: string): string {
  const value = t(`${prefix}.${id}`, {}, locale);
  return value === `${prefix}.${id}` ? fallback : value;
}

const ORDER_BY_MESSAGE: Record<string, string> = {};
for (let i = 0; i <= 18; i++) ORDER_BY_MESSAGE[packs['zh-CN'][`order.o${i}.message`]] = `o${i}`;
for (let i = 0; i <= 2; i++) ORDER_BY_MESSAGE[packs['zh-CN'][`order.t${i}.message`]] = `t${i}`;

export function localizeOrder(person: string, message: string, locale?: string): {person: string; message: string} {
  const id = ORDER_BY_MESSAGE[message];
  if (!id) return {person, message};
  return {person: t(`order.${id}.person`, {}, locale), message: t(`order.${id}.message`, {}, locale)};
}

export function storyCopy(id: string, locale?: string): {title: string; body: string} {
  return {title: t(`story.${id}.title`, {}, locale), body: t(`story.${id}.body`, {}, locale)};
}

export function breakfastLine(index: number, locale?: string): {title: string; hint: string} {
  return {title: t(`breakfast.${index}.title`, {}, locale), hint: t(`breakfast.${index}.hint`, {}, locale)};
}

export function honorLine(level: number, locale?: string): {name: string; hint: string} {
  return {name: t(`honor.${level}.name`, {}, locale), hint: t(`honor.${level}.hint`, {}, locale)};
}

export function detectLocale(tag?: string): Locale {
  const value = (tag || '').toLowerCase();
  if (value.startsWith('zh')) return value.includes('tw') || value.includes('hk') || value.includes('hant') ? 'zh-TW' : 'zh-CN';
  if (value.startsWith('ja')) return 'ja';
  if (value.startsWith('ko')) return 'ko';
  if (value.startsWith('en')) return 'en';
  return 'zh-CN';
}

export function localDate(now = Date.now()): string {
  const date = new Date(now);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function shiftLocal(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return localDate(new Date(year, month - 1, day + days, 12).getTime());
}

export function atLocalNoon(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

export function weekKey(now = Date.now()): string {
  const [year, month, day] = localDate(now).split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  const weekday = date.getDay();
  date.setDate(date.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return localDate(date.getTime());
}
