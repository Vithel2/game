from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
out=Path('/workspace/game/art/expansion_01');out.mkdir(exist_ok=True)
F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
im=Image.new('RGB',(780,1600),'#f3f6fc');d=ImageDraw.Draw(im)
def text(x,y,s,size=24,color='#17243c',bold=False):d.text((x,y),s,font=ImageFont.truetype(B if bold else F,size),fill=color)
def rr(b,c,r=20):d.rounded_rectangle(b,r,fill=c)
blue='#1358e8';ink='#17243c';gray='#718098'
d.rectangle((0,0,780,216),fill=blue)
text(36,22,'9:41',24,'white',True);text(651,22,'100%',22,'white')
# Own parcel emblem, not an existing brand mark.
rr((36,88,94,146),'white',15)
for y in [101,115,129]:d.line((49,y,80,y),fill=blue,width=5)
text(111,75,'azon',60,'white',True)
text(38,170,'ДЕТАЛИ ДЛЯ ТВОИХ СДЕЛОК',23,'white')
rr((36,241,744,318),'white');text(62,263,'Поиск по модели или детали',27,gray)
rr((36,343,744,434),'#e1eafe')
text(58,355,'Пункт выдачи: у «Пятака»',24,blue,True)
text(58,393,'Доставка 1–3 игровых дня',22,gray)
text(38,464,'Каталог мастерской',32,ink,True)
for x,w,s,active in [(36,215,'Все детали',True),(264,222,'Инструмент',False),(499,245,'Расходники',False)]:
 rr((x,520,x+w,576),blue if active else 'white',17);text(x+19,534,s,22,'white' if active else ink)
items=[('Аккумулятор R / 01','720 ₽','2 шт. · завтра','battery',True),('Клейкая лента','180 ₽','6 шт. · завтра','tape',True),('Дисплей R / 01','2 100 ₽','Нет в наличии','screen',False),('Шлейф зарядки','390 ₽','1 шт. · через 3 дня','flex',True)]
for i,(title,price,status,kind,stock) in enumerate(items):
 y=604+i*169;rr((36,y,744,y+151),'white',23);rr((52,y+16,174,y+135),'#edf2fa',17)
 if kind=='battery':
  rr((85,y+34,140,y+115),'#273449',7);rr((102,y+26,123,y+36),'#8f9baf',3);text(100,y+49,'+',24,'#a4bbef');text(99,y+85,'−',24,'#a4bbef')
 elif kind=='tape':
  d.ellipse((72,y+36,153,y+117),fill='#65bcb1');d.ellipse((94,y+58,131,y+95),fill='#edf2fa')
 elif kind=='screen':
  rr((87,y+27,141,y+120),'#273449',9);rr((92,y+33,136,y+113),'#54748b',5);d.line((99,y+52,123,y+68,105,y+89),fill='#a2c4d2',width=2)
 else:
  d.line((86,y+45,86,y+95,139,y+95,139,y+58),fill='#c48a38',width=15)
  rr((72,y+32,102,y+50),'#273449',3);rr((126,y+49,153,y+66),'#273449',3)
 text(194,y+15,title,26,ink,True);text(194,y+60,price,28,ink,True)
 text(194,y+108,status,20,gray if stock else '#ba6247')
 rr((617,y+62,720,y+113),blue if stock else '#e8edf4',15);text(654,y+63,'+' if stock else '—',34,'white' if stock else gray)
rr((36,1307,744,1397),'#fff1de',20)
text(57,1320,'Нет нужной детали?',25,'#985b22',True)
text(57,1359,'Ищи донора в «Авиту» или у мастера.',22,'#985b22')
rr((36,1426,744,1516),blue,22);text(177,1451,'Корзина · оформить заказ',28,'white',True)
text(202,1540,'Деньги списываются при заказе',19,gray)
rr((270,1573,510,1579),ink,3)
im.save(out/'azon_screen.png')
# Home screen with original app icons, used by the phone mock-up.
home=Image.new('RGB',(780,1600),'#162a4a');hd=ImageDraw.Draw(home)
for y in range(1600):
 t=y/1600;hd.line((0,y,780,y),fill=(int(22+23*t),int(42+39*t),int(74+45*t)))
hd.text((45,46),'9:41',font=ImageFont.truetype(B,28),fill='white')
hd.text((45,210),'Среда, день 03',font=ImageFont.truetype(F,36),fill='#c3d5ef')
hd.text((42,275),'Моя мастерская',font=ImageFont.truetype(B,48),fill='white')
for x,c,title,short in [(65,'#315ae8','Авиту','а'),(310,blue,'Azon','az'),(555,'#e9a451','Банк','₽')]:
 hd.rounded_rectangle((x,516,x+160,676),35,fill=c)
 hd.text((x+40,548),short,font=ImageFont.truetype(B,64),fill='white')
 hd.text((x+13,700),title,font=ImageFont.truetype(F,29),fill='white')
hd.rounded_rectangle((40,861,740,1044),28,fill='#263f61')
hd.text((68,891),'Посылки',font=ImageFont.truetype(B,30),fill='white')
hd.text((68,948),'Заказов пока нет',font=ImageFont.truetype(F,27),fill='#bfcee2')
hd.rounded_rectangle((270,1573,510,1579),3,fill='white')
home.save(out/'phone_home.png')
print('AZON_UI_COMPLETE')
