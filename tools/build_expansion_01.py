import bpy, math, os, json
from mathutils import Vector
exec(open('/workspace/game/tools/build_prototypes.py').read().split('# Real-world scale')[0])
OUT='/workspace/game/art/expansion_01';os.makedirs(OUT,exist_ok=True)
M.update({
 'shopgreen':mat('Grocery green',(.12,.36,.20)), 'shopred':mat('Grocery red',(.70,.13,.10)),
 'azonblue':mat('Azon blue',(.025,.13,.72)), 'parcel':mat('Cardboard',(.58,.37,.19)),
 'pcb':mat('Circuit board',(.025,.18,.11)), 'copper':mat('Flex polyimide',(.64,.28,.045),.45,.35),
 'trace':mat('Flex copper traces',(.94,.61,.16),.65,.25), 'rubberblue':mat('Tool rubber',(.035,.13,.25)),
 'asphalt':mat('Asphalt',(.16,.19,.22)), 'tile':mat('Shop tiles',(.65,.65,.58)),
 'banana':mat('Yellow fruit',(.88,.65,.15)), 'apple':mat('Green fruit',(.36,.55,.14))})
glass=mat('Tinted shop glass',(.48,.70,.78),0,.18);p=glass.node_tree.nodes.get('Principled BSDF');p.inputs['Alpha'].default_value=.12
glass.diffuse_color=(.48,.70,.78,.12);M['shopglass']=glass

def sphere(name,loc,r,ma):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,radius=r,location=loc);return attach(bpy.context.object,name,ma)
def slab(name,loc,w,h,depth,r,ma):
 outline=[]
 for cx,cy,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
  for i in range(7):
   a=math.radians(start+i*15);outline.append((cx+r*math.cos(a),cy+r*math.sin(a)))
 n=len(outline);v=[(x+loc[0],y+loc[1],loc[2]+dz) for dz in [-depth/2,depth/2] for x,y in outline]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],[list(reversed(range(n))),list(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]);mesh.update()
 o=bpy.data.objects.new(name,mesh);current.objects.link(o);o.data.materials.append(M[ma]);return o
def ribbon(name,points,width,ma):
 verts=[]
 for x,y,z in points:verts.extend([(x-width/2,y,z),(x+width/2,y,z)])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(points)-1)]);mesh.update()
 o=bpy.data.objects.new(name,mesh);current.objects.link(o);o.data.materials.append(M[ma]);s=o.modifiers.new('Ribbon thickness','SOLIDIFY');s.thickness=.00012;return o
def cable(name,points,r,ma):
 data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=r;data.bevel_resolution=2
 sp=data.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
 for b,co in zip(sp.bezier_points,points):b.co=co;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,data);current.objects.link(o);data.materials.append(M[ma]);return o
def screw(name,loc):
 x,y,z=loc
 root=bpy.data.objects.new(name,None);current.objects.link(root);root.location=loc
 objs=[cyl(name+'_shaft',(x,y,z+.0016),.0007,.0032,'steel',12),cyl(name+'_head',(x,y,z+.0035),.0013,.0007,'steel',16)]
 for dims in [(.0018,.00028,.00008),(.00028,.0018,.00008)]:objs.append(box(name+'_cross',(x,y,z+.00388),dims,'ink',0))
 for j in range(4):objs.append(cyl(name+'_thread',(x,y,z+.00045+j*.00065),.00088,.00017,'steel',12))
 for o in objs:o.parent=root;o.matrix_parent_inverse=root.matrix_world.inverted()
 return root

grocery=collection('Grocery_Pyatak')
box('Foundation',(0,0,.08),(4.4,3.2,.16),'ink')
box('Floor',(0,0,.18),(4.2,3.0,.05),'tile')
for x in [-2.10,2.10]:box('Side_wall',(x,0,1.55),(.12,3.0,2.75),'cream')
box('Back_wall',(0,1.46,1.55),(4.2,.12,2.75),'cream')
box('Roof',(0,0,2.98),(4.5,3.35,.15),'shopgreen')
box('Fascia',(0,-1.59,2.55),(4.4,.14,.68),'shopgreen')
box('Sign_accent',(-1.79,-1.68,2.55),(.46,.05,.46),'shopred',.06)
label('П',(-1.94,-1.714,2.40),.37,'white',(math.pi/2,0,0))
label('ПЯТАК',(-1.32,-1.68,2.38),.43,'white',(math.pi/2,0,0))
label('ПРОДУКТЫ У ДОМА',(.50,-1.68,2.40),.105,'white',(math.pi/2,0,0))
box('Red_canopy',(0,-1.81,2.18),(4.38,.54,.095),'shopred')
for x in [-2.08,-.63,.45,2.08]:box('Front_post',(x,-1.48,1.2),(.065,.08,2.0),'shopgreen',.006)
box('Front_sill',(0,-1.48,.30),(4.2,.08,.20),'shopgreen')
for x,w in [(-1.35,1.38),(1.27,1.55)]:box('Window_glass',(x,-1.48,1.22),(w,.012,1.70),'shopglass',0)
box('Door_glass',(-.08,-1.49,1.20),(.98,.02,1.90),'shopglass',0)
for x in [-.60,.43]:box('Door_frame',(x,-1.51,1.19),(.045,.045,1.97),'steel',.004)
box('Door_top',(-.08,-1.51,2.15),(1.08,.045,.045),'steel',.004)
box('Door_handle',(.30,-1.56,1.15),(.025,.04,.36),'steel',.005)
box('Entry_step',(-.08,-1.78,.14),(1.30,.50,.14),'tile')
for x in [-1.40,1.23]:
 box('Shelf_back',(x,.97,1.20),(1.15,.07,1.88),'white')
 for z in [.40,.88,1.36,1.84]:
  box('Shelf',(x,.76,z),(1.15,.46,.04),'edge')
  for j in range(5):
   box('Food_package',(x-.44+j*.22,.74,z+.15),(.16,.19,.25),['shopred','mint','gold','white','shopgreen'][j],.012)
box('Checkout',(-1.35,-.55,.65),(1.08,.55,.90),'shopgreen')
box('Checkout_top',(-1.35,-.55,1.12),(1.12,.61,.065),'ink')
box('Payment_terminal',(-1.10,-.55,1.21),(.17,.18,.12),'ink')
box('Produce_bin',(1.30,-.60,.58),(1.0,.65,.75),'wood')
for i in range(4):
 for j in range(3):sphere('Fruit',(1.0+i*.19,-.80+j*.18,1.00),.075,'apple' if i<2 else 'banana')
box('Hours_plate',(.80,-1.505,1.40),(.45,.015,.40),'white')
label('8—23',(.62,-1.52,1.39),.085,'shopgreen',(math.pi/2,0,0))

pickup=collection('Azon_pickup')
box('Foundation',(0,0,.08),(3.35,3.2,.16),'ink')
box('Floor',(0,0,.18),(3.2,3.0,.05),'tile')
for x in [-1.58,1.58]:box('Side_wall',(x,0,1.53),(.10,3,2.70),'white')
box('Back_wall',(0,1.46,1.53),(3.2,.10,2.70),'white')
box('Roof',(0,0,2.98),(3.45,3.25,.16),'azonblue')
box('Blue_fascia',(0,-1.57,2.55),(3.35,.16,.72),'azonblue')
box('Parcel_emblem',(-1.16,-1.68,2.54),(.40,.045,.40),'white',.07)
for z in [2.44,2.54,2.64]:box('Emblem_stripe',(-1.16,-1.709,z),(.22,.008,.025),'azonblue',.005)
label('azon',(-.79,-1.68,2.36),.51,'white',(math.pi/2,0,0))
label('ПУНКТ ВЫДАЧИ',(.46,-1.68,2.39),.095,'white',(math.pi/2,0,0))
box('Canopy',(0,-1.82,2.16),(3.35,.52,.07),'azonblue')
for x in [-1.56,-.42,.65,1.56]:box('Front_post',(x,-1.49,1.18),(.06,.07,1.96),'azonblue',.005)
box('Front_sill',(0,-1.49,.32),(3.2,.08,.22),'azonblue')
for x,w in [(-.99,1.08),(1.11,.81)]:box('Window_glass',(x,-1.49,1.25),(w,.01,1.62),'shopglass',0)
box('Door_glass',(.11,-1.50,1.20),(1.02,.015,1.88),'shopglass',0)
box('Door_handle',(.49,-1.55,1.17),(.025,.03,.32),'white',.004)
box('Door_top',(.12,-1.51,2.16),(1.10,.04,.04),'azonblue')
box('Entry_step',(.12,-1.79,.14),(1.30,.53,.14),'tile')
for x in [-.97,.90]:
 for z in [.42,.98,1.54,2.10]:
  box('Parcel_shelf',(x,.98,z),(1.03,.58,.035),'steel')
  for j in range(3):
   box('Parcel',(x-.34+j*.32,.96,z+.17),(.27,.36,.29),'parcel',.006)
   box('Shipping_label',(x-.34+j*.32,.771,z+.17),(.14,.005,.09),'white',0)
 for xx in [x-.50,x+.50]:box('Shelf_upright',(xx,1.0,1.26),(.035,.55,2.15),'azonblue')
box('Counter',(-.90,-.62,.66),(1.0,.60,.91),'azonblue')
box('Countertop',(-.90,-.62,1.14),(1.06,.65,.055),'white')
box('Terminal',(-.90,-.50,1.28),(.30,.08,.22),'ink')
box('Counter_parcel',(-.58,-.70,1.27),(.25,.27,.20),'parcel')
box('Hours_plate',(1.08,-1.505,1.34),(.48,.015,.43),'white')
label('9—21',(.89,-1.52,1.36),.085,'azonblue',(math.pi/2,0,0))
label('ЗАБЕРИ СВОЁ',(.89,-1.52,1.26),.028,'azonblue',(math.pi/2,0,0))

tools=collection('Phone_repair_tools')
# Tools deliberately remain separate objects with real-world dimensions.
rod('Precision_driver_shaft',(-.13,-.065,.012),(-.13,.005,.012),.0022,'steel')
rod('Precision_driver_bit',(-.13,-.077,.012),(-.13,-.065,.012),.0012,'steel')
rod('Precision_driver_handle',(-.13,.005,.012),(-.13,.082,.012),.008,'rubberblue')
rod('Driver_rotating_cap',(-.13,.082,.012),(-.13,.092,.012),.009,'gold')
for y in [.016,.030,.044,.058]:rod('Handle_grip_band',(-.13,y,.012),(-.13,y+.003,.012),.0084,'ink')
for x in [-.070,-.058]:rod('Tweezers_arm',(x,-.055,.009),(-.064,.074,.009),.002,'steel')
rod('Tweezers_bridge',(-.070,.074,.009),(-.058,.074,.009),.003,'steel')
box('Nylon_spudger',(-.012,.020,.006),(.008,.135,.006),'ink',.002)
o=box('Spudger_flat_tip',(-.012,-.054,.005),(.014,.018,.002),'ink',.002)
# Rounded triangular opening pick, lying flat.
mesh=bpy.data.meshes.new('Opening_pick');mesh.from_pydata([(.025,-.064,.006),(.071,-.064,.006),(.048,-.023,.006)],[],[(0,1,2)]);mesh.update()
o=bpy.data.objects.new('Opening_pick',mesh);current.objects.link(o);o.data.materials.append(M['azonblue']);s=o.modifiers.new('Pick thickness','SOLIDIFY');s.thickness=.0016
cyl('Suction_cup',(.051,.038,.006),.025,.007,'mint',32)
cyl('Suction_stem',(.051,.038,.016),.006,.018,'ink')
rod('Suction_handle',(.026,.038,.027),(.076,.038,.027),.004,'gold')
slab('Magnetic_screw_tray',(.132,.015,.005),.065,.12,.006,.009,'wall')
for i in range(8):screw(f'Tray_screw_{i+1:02}',(.116+(i%2)*.027,-.022+(i//2)*.024,.009))
label('R / SERVICE',(-.158,-.11,.002),.012,'steel')

charger=collection('USB_C_charger')
slab('Charger_body',(-.075,.015,.025),.048,.054,.050,.008,'white')
box('USB_C_socket',(-.075,-.0124,.026),(.012,.001,.004),'dark',.0015)
for x in [-.0845,-.0655]:cyl('EU_mains_pin',(x,.015,.066),.002,.032,'steel')
label('20 W',(-.091,.002,.0501),.008,'ink')
points=[(-.04,-.035,.006),(.01,-.075,.006),(.10,-.075,.006),(.155,-.015,.006),(.13,.07,.006),(.065,.10,.006),(.01,.065,.006),(.05,.015,.006),(.105,.03,.006)]
cable('USB_C_cable',points,.0022,'white')
for x,y in [(-.04,-.035),(.105,.03)]:
 box('USB_C_connector_housing',(x,y,.006),(.015,.027,.009),'white',.003)
 box('USB_C_connector_tip',(x,y-.017,.006),(.008,.008,.003),'steel',.001)
box('Cable_tie',(.077,-.075,.009),(.011,.020,.012),'mint',.003)

exploded=collection('Repairable_phone_exploded')
slab('Rear_housing',(0,0,.005),.075,.157,.009,.008,'ink')
slab('Rear_cover',(.108,0,.008),.073,.155,.003,.007,'rubberblue')
box('Rear_camera_island',(.088,.048,.011),(.027,.040,.004),'ink',.004)
for y in [.039,.057]:cyl('Rear_camera_lens',(.088,y,.014),.006,.002,'glass',24)
slab('Midframe',(0,0,.012),.069,.150,.003,.006,'steel')
slab('Battery',(0,-.021,.019),.050,.077,.007,.003,'dark')
label('Li-ion',(-.020,-.013,.0226),.005,'white')
label('3.85 V · 4200 mAh',(-.021,-.027,.0226),.0028,'white')
label('R / 01',(-.015,-.043,.0226),.004,'mint')
box('Battery_pull_tab',(.014,-.064,.017),(.012,.018,.0006),'gold',0)
slab('Mainboard',(0,.047,.018),.060,.039,.003,.003,'pcb')
for x,y,w,h in [(-.015,.051,.017,.019),(.011,.054,.021,.017),(.012,.035,.018,.011)]:
 box('EMI_shield',(x,y,.021),(w,h,.002),'steel',.001)
for i in range(8):box('Board_component',(-.025+i*.007,.033,.021),(.003,.004,.002),'ink',.0003)
slab('Charging_daughterboard',(0,-.065,.018),.057,.014,.0025,.002,'pcb')
box('Internal_USB_C',(0,-.071,.021),(.010,.009,.003),'steel',.001)
box('Speaker_module',(.022,-.064,.023),(.018,.014,.006),'ink',.001)
ribbon('Main_interconnect_flex',[(.015,-.061,.023),(.015,-.035,.024),(.015,.01,.024),(.015,.033,.024)],.008,'copper')
for dx in [-.002,0,.002]:ribbon('Interconnect_trace',[(.015+dx,-.061,.0242),(.015+dx,.033,.0242)],.00035,'trace')
for x in [-.023,.022]:
 box('Camera_module',(x,.058,.026),(.014,.016,.009),'ink',.002);cyl('Internal_lens',(x,.058,.032),.005,.004,'glass',24)
for x in [-.030,.030]:
 for y in [-.065,.064]:cyl('Screw_mount',(x,y,.017),.002,.005,'steel',16)
# Display lifted at service height, with two separate folded flex cables.
slab('Display_backplate',(0,0,.081),.071,.151,.002,.007,'steel')
slab('Display_bezel',(0,0,.083),.073,.155,.002,.0075,'ink')
display=slab('OLED_panel',(0,0,.0842),.068,.148,.0005,.006,'screen')
screenmat=bpy.data.materials.new('Azon_UI');screenmat.use_nodes=True;n=screenmat.node_tree.nodes;tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(OUT+'/azon_screen.png');tex.image.pack();em=n.new('ShaderNodeEmission');screenmat.node_tree.links.new(tex.outputs['Color'],em.inputs['Color']);screenmat.node_tree.links.new(em.outputs[0],n.get('Material Output').inputs['Surface'])
display.data.materials.clear();display.data.materials.append(screenmat);uv=display.data.uv_layers.new()
for p in display.data.polygons:
 for li in p.loop_indices:
  co=display.data.vertices[display.data.loops[li].vertex_index].co;uv.data[li].uv=(co.x/.068+.5,co.y/.148+.5)
for x,w,z in [(-.016,.010,.080),(.014,.006,.079)]:
 pts=[(x,-.043,z),(x,-.082,z-.002),(x,-.096,.064),(x,-.086,.044),(x,-.058,.032),(x,.031,.027)]
 ribbon('Display_flex' if w>.008 else 'Touch_flex',pts,w,'copper')
 for dx in [-w*.28,w*.28]:ribbon('Display_flex_trace',[(a+dx,b,c+.0002) for a,b,c in pts],.0004,'trace')
 box('Flex_connector',(x,.031,.027),(w+.003,.005,.002),'ink',.0004)
for i in range(8):screw(f'Phone_screw_{i+1:02}',(-.070+(i%2)*.018,-.055+(i//2)*.035,.006))

assets=[grocery,pickup,tools,charger,exploded]
names=['grocery_pyatak','azon_pickup','repair_tools','usb_c_charger','repairable_phone_exploded']
stats={}
for col,name in zip(assets,names):
 bpy.ops.object.select_all(action='DESELECT')
 for o in col.objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=f'{OUT}/{name}.glb',use_selection=True,export_format='GLB',export_apply=True)
 deps=bpy.context.evaluated_depsgraph_get();tri=0
 for o in col.objects:
  if o.type in {'MESH','FONT','CURVE'}:
   e=o.evaluated_get(deps);me=e.to_mesh();me.calc_loop_triangles();tri+=len(me.loop_triangles);e.to_mesh_clear()
 stats[name]={'objects':len(col.objects),'triangles':tri}

street=collection('Street_presentation')
for src,offset in [(grocery,(-1.78,0,0)),(pickup,(2.14,0,0))]:
 for original in src.objects:
  copy=original.copy();street.objects.link(copy);copy.location+=Vector(offset)
box('Pavement',(.10,-.35,-.04),(8.45,4.95,.12),'tile')
box('Road',(.10,-3.59,-.12),(10,2.0,.10),'asphalt')
for x in [-2,0,2]:box('Road_mark',(x,-3.60,-.063),(1.1,.055,.004),'white',0)
for x in [-4.05,4.05]:
 box('Bollard',(x,-2.28,.30),(.12,.12,.60),'ink');box('Bollard_reflector',(x,-2.28,.50),(.125,.125,.10),'gold')
stage=collection('Presentation_only');box('Backdrop',(0,0,-.30),(200,200,.10),'dark',0)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=False;scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.world.color=(.18,.18,.18);scene.view_settings.view_transform='AgX'
lights=[]
def light(loc,power,size,color):
 data=bpy.data.lights.new('Softbox','AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
 o=bpy.data.objects.new('Softbox',data);stage.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler();lights.append(o)
light((1,-5,8),1600,7,(1,.88,.72));light((-5,-2,5),900,5,(.65,.83,1));light((4,5,7),1700,5,(1,.86,.67))
data=bpy.data.cameras.new('Camera');cam=bpy.data.objects.new('Camera',data);stage.objects.link(cam);scene.camera=cam;data.type='ORTHO'
allcols=assets+[street]
def render(name,col,loc,target,scale,small=False):
 for c in allcols:c.hide_render=c!=col
 for l in lights:l.hide_render=small
 if small:
  # Small props use proportionally scaled softboxes for balanced lighting.
  for l in prop_lights:l.hide_render=False
 else:
  for l in prop_lights:l.hide_render=True
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();data.ortho_scale=scale
 scene.render.filepath=f'{OUT}/{name}.png';bpy.ops.render.render(write_still=True)
before=len(lights);light((.1,-.3,.6),12,.6,(1,.91,.8));light((-.4,.1,.4),6,.4,(.7,.85,1));prop_lights=lights[before:];lights=lights[:before]
render('01_neighborhood',street,(9,-14,9),(0,-.3,1.0),11.5)
render('02_repair_tools',tools,(.24,-.35,.65),(0,0,.012),.39,True)
render('03_phone_disassembly',exploded,(.35,-.50,.45),(.025,0,.038),.32,True)
render('04_charger',charger,(.25,-.40,.45),(.025,.015,.02),.33,True)
for c in allcols:c.hide_render=c!=street
for l in lights:l.hide_render=False
for l in prop_lights:l.hide_render=True
cam.location=(9,-14,9);cam.rotation_euler=(Vector((0,-.3,1))-cam.location).to_track_quat('-Z','Y').to_euler();data.ortho_scale=11.5
scene.render.filepath=f'{OUT}/01_neighborhood.png'
for c in assets:
 for o in c.objects:o.hide_set(True)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=OUT+'/expansion_01.blend')
with open(OUT+'/asset_stats.json','w') as f:json.dump(stats,f,indent=2)
print('EXPANSION_COMPLETE',json.dumps(stats))
