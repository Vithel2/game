import bpy, math, os, json
from mathutils import Vector

OUT = '/workspace/game/art/prototypes'
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
    if c.name != 'Collection': bpy.data.collections.remove(c)

def mat(name, color, metal=0, rough=.55, emission=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
    if emission:
        p.inputs['Emission Color'].default_value=(*color,1); p.inputs['Emission Strength'].default_value=emission
    return m
M={
'ink':mat('Graphite',(.035,.052,.065),.35), 'screen':mat('Screen navy',(.025,.075,.10),.1,.3),
'mint':mat('Mint enamel',(.16,.56,.49)), 'gold':mat('Warm accent',(.98,.53,.16)),
'wood':mat('Honey plywood',(.48,.27,.12)), 'edge':mat('Plywood edge',(.70,.45,.23)),
'cream':mat('Warm plaster',(.73,.70,.59)), 'wall':mat('Faded teal paint',(.27,.44,.43)),
'white':mat('Warm white',(.91,.89,.79)), 'dark':mat('Dark rubber',(.075,.10,.11)),
'steel':mat('Brushed steel',(.40,.48,.50),.7,.32), 'blue':mat('Bed linen',(.24,.38,.49)),
'glass':mat('Lens glass',(.035,.15,.21),.65,.18), 'light':mat('Lamp diffuser',(1,.78,.42),0,.5,2),
'window':mat('Daylight glass',(.47,.75,.80),0,.4,.4), 'red':mat('Muted red',(.62,.22,.16))}
font=bpy.data.fonts.load('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
current=None
def attach(o,name,ma):
    o.name=name
    for c in list(o.users_collection): c.objects.unlink(o)
    current.objects.link(o)
    if ma:o.data.materials.append(M[ma])
    return o
def box(name,loc,size,ma,bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=attach(bpy.context.object,name,ma)
    o.dimensions=size; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        b=o.modifiers.new('Soft manufactured edges','BEVEL');b.width=bevel;b.segments=2
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o
def cyl(name,loc,r,depth,ma,verts=16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=loc)
    o=attach(bpy.context.object,name,ma);b=o.modifiers.new('Edge bevel','BEVEL');b.width=min(.006,r*.15);b.segments=2
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
def rod(name,a,b,r,ma):
    d=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,d.length,ma)
    o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return o
def label(body,loc,size,ma='white',rot=(0,0,0),align='LEFT'):
    bpy.ops.object.text_add(location=loc,rotation=rot);o=attach(bpy.context.object,'Text_'+body,ma)
    o.data.body=body;o.data.font=font;o.data.size=size;o.data.extrude=.0001;o.data.align_x=align
    return o
def collection(name):
    global current
    current=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(current);return current

# Real-world scale in metres. Local origins sit at ground / table contact level.
phone=collection('01_Smartphone')
box('Metal_frame',(0,0,.006),(.076,.154,.012),'steel',.006)
box('Rear_cover',(0,0,.002),(.073,.151,.006),'mint',.005)
box('Display_assembly',(0,0,.012),(.072,.150,.005),'ink',.005)
box('Display_glass',(0,0,.015),(.065,.137,.001),'screen',.004)
box('Earpiece',(0,.065,.016),(.015,.0018,.0008),'steel',.0005)
cyl('Selfie_camera',(.022,.064,.016),.002,.001,'glass')
box('Power_button',(.039,.025,.007),(.002,.021,.003),'gold',.001)
box('Volume_rocker',(-.039,.025,.007),(.002,.029,.003),'ink',.001)
box('USB_C_port',(0,-.077,.006),(.010,.001,.003),'dark',.001)
for x in [-.025,-.021,-.017,.017,.021,.025]:box('Speaker_grille',(x,-.077,.006),(.0015,.001,.002),'dark',.0004)
label('09:41',(-.027,.050,.016),.007)
label('БАРАХЛО',(-.027,.031,.016),.007,'mint')
label('НАЙДИ СВОЮ СДЕЛКУ',(-.027,.021,.016),.0027)
for i,(title,price) in enumerate([('НЕ ВКЛЮЧАЕТСЯ','800 ₽'),('ПОСЛЕ РЕМОНТА','2 400 ₽'),('КАК НОВЫЙ','4 500 ₽')]):
    y=.003-i*.023
    box('Listing_card',(0,y,.016),(.056,.020,.0007),'dark',.001)
    box('Listing_thumbnail',(-.020,y,.0166),(.010,.014,.0005),'mint' if i!=1 else 'gold',.001)
    label(title,(-.012,y+.003,.017),.0026)
    label(price,(-.012,y-.005,.017),.004,'gold')
box('Home_indicator',(0,-.063,.016),(.023,.0015,.0007),'white',.0005)
box('Rear_camera_island',(-.020,.052,-.002),(.024,.032,.004),'ink',.004)
for y in [.045,.059]:cyl('Rear_lens',(-.020,y,-.005),.006,.003,'glass')
cyl('Rear_flash',(-.001,.055,-.002),.0025,.001,'white')
# Separately named repair parts are kept beside/inside the housing for future gameplay.
box('Battery_internal',(0,-.008,.006),(.045,.075,.004),'dark',.002)

bench=collection('02_Repair_workbench')
box('Worktop',(0,0,.77),(1.5,.70,.055),'wood',.016)
box('Front_edge',(0,-.35,.77),(1.49,.018,.045),'edge',.006)
for x in [-.65,.65]:
    for y in [-.25,.25]:box('Steel_leg',(x,y,.375),(.045,.045,.75),'ink',.006)
box('Rear_crossbar',(0,.25,.17),(1.30,.035,.045),'ink')
box('Drawer_cabinet',(.47,0,.50),(.40,.55,.45),'wall')
for z in [.36,.50,.64]:
    box('Drawer_front',(.47,-.282,z),(.37,.025,.12),'mint',.008)
    box('Drawer_handle',(.47,-.305,z),(.12,.025,.018),'steel',.004)
box('Silicone_repair_mat',(-.16,-.02,.803),(.65,.43,.012),'mint',.015)
for x in [-.40,-.30,-.20,-.10]:box('Mat_parts_tray',(x,.13,.811),(.075,.060,.006),'wall',.004)
for x in [-.38,.07]:
    for y in [-.18,.10]:cyl('Mat_screw',(x,y,.813),.005,.005,'steel',8)
box('Power_supply',(.50,.18,.88),(.23,.21,.16),'cream')
box('Power_supply_face',(.50,.068,.88),(.20,.012,.13),'ink',.006)
label('04.20',(.42,.060,.895),.026,'mint',(math.pi/2,0,0))
for x in [.44,.55]:
    o=cyl('Power_supply_dial',(x,.05,.85),.018,.022,'steel');o.rotation_euler.x=math.pi/2
rod('Lamp_stem',(-.60,.22,.82),(-.60,.22,1.23),.015,'ink')
rod('Lamp_arm',(-.60,.22,1.23),(-.30,.12,1.40),.014,'ink')
cyl('Lamp_base',(-.60,.22,.812),.085,.025,'ink')
box('Lamp_head',(-.24,.10,1.39),(.23,.13,.045),'gold')
box('Lamp_diffuser',(-.24,.10,1.363),(.19,.10,.008),'light')
rod('Screwdriver_shaft',(-.06,-.16,.821),(.07,-.16,.821),.003,'steel')
rod('Screwdriver_grip',(.07,-.16,.821),(.16,-.16,.821),.012,'gold')
rod('Tweezers_A',(-.33,-.07,.82),(-.18,-.06,.82),.003,'steel')
rod('Tweezers_B',(-.33,-.07,.82),(-.18,-.04,.82),.003,'steel')
box('Parts_box',(.46,-.12,.826),(.20,.16,.05),'cream')
label('ДЕТАЛИ',(.38,-.14,.854),.025,'ink')

room=collection('03_Starter_room')
box('Foundation',(0,0,-.09),(4.2,3.6,.18),'ink',.025)
for i in range(12):
    for j in range(4):
        box('Floor_plank',(-1.92+i*.35,-1.35+j*.89,.015),(.34,.88,.03),'wood' if (i+j)%3 else 'edge',.003)
box('Back_wall',(0,1.76,1.35),(4.2,.10,2.7),'cream')
# Open window in the left wall (actual gap, with low-poly daylight panes).
box('Left_wall_lower',(-2.05,0,.45),(.10,3.5,.90),'wall')
box('Left_wall_upper',(-2.05,0,2.48),(.10,3.5,.44),'wall')
box('Left_wall_front',(-2.05,-1.35,1.58),(.10,.80,1.36),'wall')
box('Left_wall_back',(-2.05,1.20,1.58),(.10,1.10,1.36),'wall')
box('Window_glass',(-2.05,-.15,1.58),(.025,1.60,1.25),'window',0)
for y in [-.96,.66,-.15]:box('Window_vertical',(-2.01,y,1.58),(.08,.045,1.38),'white',.005)
for z in [.90,1.58,2.26]:box('Window_horizontal',(-2.01,-.15,z),(.08,1.68,.045),'white',.005)
box('Window_sill',(-1.92,-.15,.90),(.28,1.80,.065),'white')
box('Back_skirting',(0,1.69,.09),(4.03,.045,.15),'white',.003)
box('Left_skirting',(-1.98,0,.09),(.045,3.43,.15),'white',.003)
# Bed and textiles
box('Bed_frame',(-1.30,.52,.24),(1.12,2.02,.30),'edge')
for x in [-1.76,-.84]:
    for y in [-.33,1.36]:box('Bed_foot',(x,y,.12),(.085,.085,.24),'ink')
box('Mattress',(-1.30,.52,.44),(1.06,1.94,.19),'white',.065)
box('Duvet',(-1.30,.20,.56),(1.08,1.31,.11),'blue',.04)
box('Blanket_fold',(-1.30,-.27,.62),(1.10,.32,.035),'mint',.015)
box('Pillow',(-1.30,1.15,.58),(.76,.38,.14),'cream',.085)
box('Headboard',(-1.30,1.55,.53),(1.16,.065,.80),'wood')
box('Bedside_crate',(-.43,1.28,.22),(.42,.44,.44),'edge')
cyl('Mug',(-.43,1.27,.49),.055,.10,'gold')
box('Rug',(.20,-.67,.045),(1.40,1.55,.02),'wall',.02)
for x in [-.40,.80]:box('Rug_border',(x,-.67,.058),(.025,1.45,.004),'cream',0)
# Compact kitchenette
box('Kitchen_cabinet',(1.63,1.30,.43),(.66,.70,.84),'wall')
box('Kitchen_top',(1.63,1.30,.88),(.72,.75,.06),'cream')
box('Kitchen_front',(1.63,.94,.44),(.59,.025,.70),'mint')
box('Kitchen_handle',(1.80,.91,.62),(.025,.025,.18),'steel')
cyl('Kettle_body',(1.63,1.29,1.02),.105,.23,'steel')
cyl('Kettle_lid',(1.63,1.29,1.145),.08,.025,'ink')
rod('Kettle_handle',(1.74,1.29,.97),(1.78,1.29,1.12),.022,'ink')
cyl('Water_bottle',(1.42,1.18,1.02),.040,.22,'window')
cyl('Bottle_cap',(1.42,1.18,1.14),.027,.025,'gold')
box('Wall_shelf',(.70,1.54,1.90),(1.60,.32,.055),'edge')
for i in range(4):box('Spare_parts_carton',(.18+i*.30,1.53,2.04),(.24,.23,.22),'cream' if i%2 else 'wood')
box('Poster',(.28,1.697,1.25),(.60,.014,.80),'ink')
label('С РУК',(.02,1.683,1.42),.12,'mint',(math.pi/2,0,0))
label('ПОЧИНИ.\nПРОДАЙ.\nПОВТОРИ.',(.02,1.681,1.22),.066,'white',(math.pi/2,0,0))
# Outlets
box('Socket',(.87,1.69,.38),(.16,.035,.10),'white')
for x in [.83,.91]:
    o=cyl('Socket_hole',(x,1.667,.38),.015,.008,'ink');o.rotation_euler.x=math.pi/2

assets=[phone,bench,room]
stats={}
for col,filename in zip(assets,['smartphone','repair_workbench','starter_room']):
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=f'{OUT}/{filename}.glb',use_selection=True,export_format='GLB',export_apply=True)
    deps=bpy.context.evaluated_depsgraph_get(); tris=0
    for o in col.objects:
        if o.type in {'MESH','FONT'}:
            e=o.evaluated_get(deps);mesh=e.to_mesh();mesh.calc_loop_triangles();tris+=len(mesh.loop_triangles);e.to_mesh_clear()
    stats[filename]={'objects':len(col.objects),'triangles':tris,'bytes':os.path.getsize(f'{OUT}/{filename}.glb')}

# Presentation scene, hidden per-asset as needed. All previews are actual renders.
stage=collection('Presentation_only')
box('Backdrop',(0,0,-.22),(200,200,.10),'dark',0)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=64
scene.cycles.use_denoising=False;scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world.color=(.25,.25,.25)
scene.view_settings.view_transform='AgX'
def area(name,loc,power,size,color):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
    o=bpy.data.objects.new(name,data);stage.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
area('Large softbox',(1,-3,6),650,5,(1,.86,.68));area('Window fill',(-3,-1,4),450,4,(.62,.83,1));area('Rim',(2,4,5),700,3,(1,.72,.43))
data=bpy.data.cameras.new('Camera');cam=bpy.data.objects.new('Camera',data);stage.objects.link(cam);scene.camera=cam;data.type='ORTHO';data.lens=45
def render(name,visible,loc,target,scale):
    for c in assets:c.hide_render=c not in visible
    cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();data.ortho_scale=scale
    scene.render.filepath=f'{OUT}/{name}.png';bpy.ops.render.render(write_still=True)
# Display smartphone on an angled presentation support, large enough to inspect screen.
render('01_smartphone',[phone],(.16,-.22,.40),(0,0,0),.215)
render('02_workbench',[bench],(2.1,-2.5,2.0),(0,0,.73),2.45)
# Place instances of the two props in the room for a coherent environment preview.
for source,offset in [(bench,(.30,1.23,0)),(phone,(.10,1.20,.82))]:
    for original in source.objects:
        copy=original.copy();copy.name='Room_'+original.name;room.objects.link(copy);copy.location+=Vector(offset)
render('03_room',[room],(6,-8,6.2),(0,0,1.0),6.7)
for c in [phone,bench]:
    c.hide_render=True
    for o in c.objects:o.hide_set(True)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=f'{OUT}/s_ruk_prototypes.blend')
with open(f'{OUT}/asset_stats.json','w') as f:json.dump(stats,f,indent=2)
print('ASSETS_COMPLETE',json.dumps(stats))
