"""Original static UI texture for the fictional in-game marketplace."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
OUT=Path('/workspace/game/art/prototypes_v2');OUT.mkdir(exist_ok=True)
im=Image.new('RGB',(780,1600),'#f6f7fa');d=ImageDraw.Draw(im)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def text(x,y,s,size=24,color='#202738',bold=False):
 d.text((x,y),s,font=ImageFont.truetype(BOLD if bold else FONT,size),fill=color)
def rr(rect,fill,r=20,outline=None,width=1):d.rounded_rectangle(rect,r,fill,outline,width)
blue='#315ae8';orange='#f18b4c';gray='#737c8e';ink='#202738'
d.rectangle((0,0,780,208),fill='white')
text(40,22,'9:41',25,bold=True)
for i in range(4):rr((654+i*9,43-i*5,659+i*9,50),ink,2)
rr((705,28,746,48),ink,5);rr((709,32,736,44),'#ffffff',2)
# Original folded-price-tag mark, avoiding the competitor's multicolour circles.
rr((38,91,92,145),blue,15);d.polygon([(55,103),(78,103),(83,117),(67,134),(49,116)],fill='white')
d.ellipse((72,108,77,113),fill=blue)
text(108,79,'авиту',54,bold=True)
rr((588,96,740,140),'#fff0e5',16);text(608,105,'ДЕНЬ 03',20,'#b95e26',True)
text(40,164,'Центральный район',23,gray);text(695,161,'⌄',26,blue)
# Search, filters and category tabs.
rr((36,224,744,306),'#e9edf5',24)
d.ellipse((62,249,86,273),outline=gray,width=3);d.line((83,271,94,282),fill=gray,width=3)
text(111,245,'Найти выгодную сделку',25,gray)
d.line((662,244,662,286),fill='#d3d9e5',width=2)
for y,knob in [(251,704),(270,691),(286,710)]:
 d.line((682,y,722,y),fill=blue,width=3);d.ellipse((knob-4,y-4,knob+4,y+4),fill=blue)
for x,w,s,active in [(36,204,'Телефоны',True),(254,198,'Запчасти',False),(466,278,'Сохранённое',False)]:
 rr((x,329,x+w,389),blue if active else 'white',19)
 text(x+22,344,s,23,'white' if active else ink,active)
rr((36,416,744,502),'#e9eefc',21)
text(58,431,'4 новых объявления',25,blue,True)
text(58,468,'Следующая подборка в 18:00',19,gray)
text(40,529,'Свежие предложения',30,bold=True)

def product_photo(x,y,w,h,variant):
 # Small, original stylised product photographs drawn directly for this UI.
 colors=['#e2e8ea','#e9e3d9','#dbe5df','#e2e1ec']
 rr((x,y,x+w,y+h),colors[variant],18)
 d.ellipse((x+60,y+h-65,x+w-35,y+h-20),fill='#c2c8cb')
 px=x+102;py=y+24
 rr((px+6,py+5,px+126,py+208),'#acb6bc',19)
 rr((px,py,px+118,py+202),['#40464d','#76968f','#414960','#34383f'][variant],18)
 if variant in [0,2]:
  rr((px+6,py+7,px+112,py+194),'#111a25',14)
  d.ellipse((px+55,py+12,px+62,py+19),fill='#59616b')
  if variant==2:
   for pts in [[(px+20,py+48),(px+70,py+90),(px+50,py+127),(px+98,py+168)],[(px+70,py+90),(px+103,py+69)]]:d.line(pts,fill='#9badb7',width=2)
 else:
  rr((px+10,py+12,px+62,py+83),'#29363c',12)
  for cy in [py+31,py+62]:
   d.ellipse((px+20,cy-11,px+42,cy+11),fill='#101a26',outline='#829aa8',width=3)
  d.ellipse((px+47,py+31,px+53,py+37),fill='#f6e8c9')
  d.line((px+44,py+142,px+77,py+142),fill='#a8bcb5',width=3)
 if variant==1:
  rr((x+236,y+144,x+304,y+210),'#faf6ec',7);d.line((x+245,y+158,x+295,y+158),fill='#b6b9b7',width=3)

cards=[('Не включается','900 ₽','Игорь','4,8 · 24 отзыва',0),('128 ГБ, комплект','6 500 ₽','Алексей','4,9 · 108 отзывов',1),('После ремонта','2 700 ₽','Мастерская № 5','4,2 · 61 отзыв',2),('Старый флагман','4 200 ₽','Денис','Новый продавец',3)]
for idx,(title,price,seller,rating,v) in enumerate(cards):
 x=36+(idx%2)*364;y=589+(idx//2)*381
 rr((x,y,x+344,y+364),'white',22)
 product_photo(x+8,y+8,328,231,v)
 rr((x+284,y+20,x+326,y+62),'white',21);text(x+292,y+22,'♡',29,blue)
 text(x+16,y+250,price,31,bold=True)
 text(x+16,y+291,title,22)
 text(x+16,y+324,('★ '+rating) if idx!=3 else rating,17,'#58657b')
rr((36,1374,744,1431),'#fff0e5',17)
text(58,1390,'Совет: проверь телефон до оплаты',21,'#9c582d')
# Navigation with an original central sell action.
d.rectangle((0,1453,780,1600),fill='white')
d.line((0,1453,780,1453),fill='#e2e6ef',width=2)
for x,s in [(80,'Лента'),(236,'Избранное'),(544,'Чаты'),(700,'Профиль')]:
 if s=='Лента':
  for dx in [-10,6]:
   for dy in [0,16]:rr((x+dx,1477+dy,x+dx+11,1488+dy),blue,3)
 elif s=='Избранное':text(x-14,1469,'♡',35,gray)
 elif s=='Чаты':
  rr((x-17,1478,x+17,1501),'white',7,gray,2);d.line((x-9,1500,x-13,1507,x-1,1500),fill=gray,width=2)
 else:
  d.ellipse((x-8,1474,x+8,1490),outline=gray,width=2);d.arc((x-17,1491,x+17,1513),180,360,fill=gray,width=2)
 font=ImageFont.truetype(FONT,16);tw=d.textbbox((0,0),s,font=font)[2];text(x-tw/2,1516,s,16,blue if s=='Лента' else gray)
rr((354,1465,426,1537),blue,24);d.line((376,1501,404,1501),fill='white',width=4);d.line((390,1487,390,1515),fill='white',width=4)
rr((270,1571,510,1577),ink,3)
im.save(OUT/'avitu_screen.png')
print('UI_SAVED',OUT/'avitu_screen.png')
