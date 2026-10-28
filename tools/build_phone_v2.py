import bpy, math, os, json
from mathutils import Vector
# Reuse the established materials and modelling helpers without rebuilding v1.
source=open('/workspace/game/tools/build_prototypes.py').read()
exec(source.split('# Real-world scale')[0])
OUT='/workspace/game/art/prototypes_v2'
phone=collection('Smartphone_v2')
M['frame2']=mat('Satin titanium',(.18,.21,.24),.8,.28)
M['rear2']=mat('Midnight blue rear',(.045,.085,.13),.22,.32)
def slab(name,w,h,z,depth,r,material):
 outline=[]
 for cx,cy,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
  for i in range(9):
   a=math.radians(start+i*90/8);outline.append((cx+r*math.cos(a),cy+r*math.sin(a)))
 n=len(outline);v=[(x,y,z+dz) for dz in [-depth/2,depth/2] for x,y in outline]
 faces=[list(reversed(range(n))),list(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);current.objects.link(o);o.data.materials.append(M[material])
 b=o.modifiers.new('Precision edge','BEVEL');b.width=.00035;b.segments=2;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
slab('Frame',.075,.157,.005,.009,.008,'frame2')
slab('Back_panel',.073,.155,.0013,.0025,.0075,'rear2')
slab('Black_front_bezel',.073,.155,.009,.0018,.0075,'ink')
box('Power_button',(.038,.022,.005),(.0015,.022,.0025),'frame2',.0006)
for y in [.026,.046]:box('Volume_button',(-.038,y,.005),(.0015,.014,.0025),'frame2',.0006)
box('USB_C_port',(0,-.0787,.0048),(.009,.0007,.0025),'dark',.001)
for x in [-.026,-.022,-.018,.018,.022,.026]:
 box('Speaker_slot',(x,-.0787,.0048),(.0018,.0007,.0018),'dark',.0007)
# Rounded display with proper UVs; the interface is a flat texture, not raised text.
w=.068;h=.148;r=.006;verts=[]
for cx,cy,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
 for i in range(9):
  a=math.radians(start+i*90/8);verts.append((cx+r*math.cos(a),cy+r*math.sin(a),.0101))
mesh=bpy.data.meshes.new('Display_UV_mesh');mesh.from_pydata(verts,[],[list(range(len(verts)))]);mesh.update()
o=bpy.data.objects.new('Display_with_Avitu',mesh);current.objects.link(o)
uv=mesh.uv_layers.new(name='UVMap')
for p in mesh.polygons:
 for li in p.loop_indices:
  v=mesh.vertices[mesh.loops[li].vertex_index].co;uv.data[li].uv=(v.x/w+.5,v.y/h+.5)
screen=bpy.data.materials.new('Avitu_original_UI');screen.use_nodes=True;p=screen.node_tree.nodes.get('Principled BSDF')
p.inputs['Roughness'].default_value=.38;p.inputs['Specular IOR Level'].default_value=.12
tex=screen.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(OUT+'/avitu_screen.png');tex.image.pack()
em=screen.node_tree.nodes.new('ShaderNodeEmission');em.inputs['Strength'].default_value=1
screen.node_tree.links.new(tex.outputs['Color'],em.inputs['Color']);screen.node_tree.links.new(em.outputs[0],screen.node_tree.nodes.get('Material Output').inputs['Surface']);o.data.materials.append(screen)
cyl('Punch_hole_camera',(0,.067,.0103),.0017,.0003,'ink',24)
cyl('Punch_hole_lens',(0,.067,.0105),.0008,.0002,'glass',16)
box('Earpiece',(0,.0758,.010),(.012,.0005,.0003),'dark',.0002)
box('Rear_camera_plate',(-.020,.050,-.0008),(.027,.041,.003),'frame2',.005)
for y in [.040,.059]:
 cyl('Rear_lens_ring',(-.020,y,-.003),.007,.003,'frame2',32)
 cyl('Rear_lens_glass',(-.020,y,-.0047),.0055,.0007,'glass',24)
cyl('Rear_flash',(.002,.061,-.0005),.0024,.001,'white',16)
label('R / 01',(-.015,-.056,-.0002),.004,'steel',(math.pi,0,0))
bpy.ops.object.select_all(action='DESELECT')
for o in phone.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT+'/smartphone_v2.glb',use_selection=True,export_format='GLB',export_apply=True)
stage=collection('Presentation_only');box('Backdrop',(0,0,-.018),(200,200,.01),'dark',0)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=False
scene.render.resolution_x=1200;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
scene.world.color=(.12,.12,.12);scene.view_settings.view_transform='Standard'
def light(loc,power,size,color):
 data=bpy.data.lights.new('Softbox','AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
 o=bpy.data.objects.new('Softbox',data);stage.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
light((.1,-.2,.5),12,.5,(1,.94,.85));light((-.3,.1,.3),7,.4,(.7,.85,1))
data=bpy.data.cameras.new('Camera');cam=bpy.data.objects.new('Camera',data);stage.objects.link(cam);scene.camera=cam;data.type='ORTHO';data.ortho_scale=.190
cam.location=(.09,-.12,.48);cam.rotation_euler=(Vector((0,0,.003))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=OUT+'/smartphone_v2.png';bpy.ops.render.render(write_still=True)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=OUT+'/smartphone_v2.blend')
print('PHONE_V2_COMPLETE')
