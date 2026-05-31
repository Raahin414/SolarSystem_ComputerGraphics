import { mat4, vec3 } from '../lib/gl-matrix.js';

export class OrbitCamera {
  constructor(canvas) {
    this.canvas = canvas;
    this.target = vec3.fromValues(0, 0, 0);
    this.distance = 34;
    this.yaw = 0.6;
    this.pitch = -0.28;
    this.eye = vec3.fromValues(0, 0, this.distance);
    this.view = mat4.create();
    this.projection = mat4.create();
    this.drag = false;
    this.lx = 0;
    this.ly = 0;
    canvas.addEventListener('mousedown', (e) => { this.drag = true; this.lx = e.clientX; this.ly = e.clientY; });
    window.addEventListener('mouseup', () => { this.drag = false; });
    window.addEventListener('mousemove', (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.lx;
      const dy = e.clientY - this.ly;
      this.lx = e.clientX;
      this.ly = e.clientY;
      this.yaw += dx * 0.004;
      this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch + dy * 0.003));
    });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.distance *= e.deltaY > 0 ? 1.08 : 0.92;
      this.distance = Math.max(8, Math.min(120, this.distance));
    }, { passive: false });
  }

  update(width, height) {
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    this.eye[0] = this.target[0] + this.distance * cp * sy;
    this.eye[1] = this.target[1] + this.distance * sp;
    this.eye[2] = this.target[2] + this.distance * cp * cy;
    mat4.lookAt(this.view, this.eye, this.target, vec3.fromValues(0, 1, 0));
    mat4.perspective(this.projection, Math.PI / 3, width / height, 0.1, 500);
  }
}
