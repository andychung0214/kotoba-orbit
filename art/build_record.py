"""Blender Scripting 工作區執行；建立原創唱片集合，不刪除既有場景。未在本機執行驗證。"""
import bpy
from math import pi

collection = bpy.data.collections.new("KotobaOrbit")
bpy.context.scene.collection.children.link(collection)

def material(name, color, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = 0.45
    return mat

def move_to_collection(obj, name, mat):
    obj.name = name
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.append(mat)

vinyl = material("Orbit Vinyl", (0.08, 0.07, 0.12), 0.6)
purple = material("Orbit Lavender", (0.53, 0.40, 0.76))
green = material("Orbit Green", (0.65, 0.8, 0.35))
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.66, depth=0.10)
move_to_collection(bpy.context.object, "Record", vinyl)
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.67, depth=0.012, location=(0, 0, 0.065))
move_to_collection(bpy.context.object, "Label", purple)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.13, -0.12, -0.22))
sleeve = bpy.context.object
sleeve.scale = (3.4, 3.4, 0.10)
sleeve.rotation_euler.z = 0.24
move_to_collection(sleeve, "Sleeve", purple)
bpy.ops.mesh.primitive_torus_add(major_radius=2.08, minor_radius=0.012, major_segments=96, minor_segments=8)
move_to_collection(bpy.context.object, "Orbit", purple)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.105, location=(2.08, 0, 0.2))
move_to_collection(bpy.context.object, "Orbit Marker", green)
print("KotobaOrbit collection created. Review before exporting selected objects to GLB.")
