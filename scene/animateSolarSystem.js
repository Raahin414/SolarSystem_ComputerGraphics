import * as THREE from 'three';

const helpers = {
  orbitRotation: new THREE.Matrix4(),
  orbitTilt: new THREE.Matrix4(),
  translate: new THREE.Matrix4(),
  spin: new THREE.Matrix4(),
  moonOrbit: new THREE.Matrix4(),
  moonTranslate: new THREE.Matrix4(),
  moonSpin: new THREE.Matrix4()
};

export function startSolarSystemAnimation({ app, controls, composer, system, starfield, planetSystems }) {
  function animate() {
    requestAnimationFrame(animate);

    const t = app.clock.getElapsedTime();

    system.sun.sunGlow.material.uniforms.uTime.value = t;
    const pulse = 1 + Math.sin(t * 1.2) * 0.02;
    system.sun.group.scale.setScalar(pulse);

    system.sun.sunCore.rotation.y += 0.0034;
    system.sun.sunCore.rotation.x += 0.0012;

    planetSystems.forEach((entry, index) => {
      const { config } = entry;

      helpers.orbitRotation.makeRotationY(t * config.orbitSpeed + index * 0.95);
      helpers.orbitTilt.makeRotationZ(config.orbitTilt);
      entry.pivot.matrix.multiplyMatrices(helpers.orbitRotation, helpers.orbitTilt);

      helpers.translate.makeTranslation(config.orbitRadius, 0, 0);
      helpers.spin.makeRotationY(t * config.spinSpeed);
      entry.mesh.matrix.multiplyMatrices(helpers.translate, helpers.spin);

      if (entry.moon) {
        helpers.moonOrbit.makeRotationY(t * entry.moon.orbitSpeed);
        entry.moon.pivot.matrix.copy(helpers.moonOrbit);

        helpers.moonTranslate.makeTranslation(entry.moon.orbitRadius, 0, 0);
        helpers.moonSpin.makeRotationY(t * entry.moon.spinSpeed);
        entry.moon.mesh.matrix.multiplyMatrices(helpers.moonTranslate, helpers.moonSpin);
      }
    });

    system.reflective.rotation.y += 0.0045;
    system.reflective.rotation.x = Math.sin(t * 0.6) * 0.24;

    system.debris.debrisGroup.rotation.y += 0.0006;
    system.debris.debrisPieces.forEach((piece, index) => {
      piece.mesh.rotation.x += piece.speed * 0.008;
      piece.mesh.rotation.y += piece.speed * 0.01;
      piece.mesh.position.y += Math.sin(t * piece.speed + piece.phase + index * 0.07) * piece.drift * 0.0012;
    });

    starfield.points.rotation.y = t * 0.006;
    starfield.material.opacity = 0.72 + Math.sin(t * 0.4) * 0.08;

    controls.update();
    composer.render();
  }

  animate();
}
