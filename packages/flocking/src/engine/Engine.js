import _ from 'lodash';
import * as d3 from 'd3';
import {Vector, TwoEngine} from '2d-engine';

class Engine extends TwoEngine {
  constructor(svgClass, pixelX, pixelY, worldX, worldY, options) {
    super(svgClass, pixelX, pixelY, worldX, worldY, options || {
      trackFPS: function() {}
    });

    options = options || {};

    this.zoomEnabled = false;
    this.nextFPSUpdate = 1000;
  }

  initializeCanvas(canvasClass, pixelX, pixelY) {
    const parent = document.querySelector(canvasClass);

    this.canvas = new Two({
      width: pixelX,
      height: pixelY,
      type: Two.Types.canvas
    });

    this.canvas.appendTo(parent);

    const context = this;
    this.canvas.bind('update', function() {
      context.tick();
    });
  }

  processEntity(entity, index) {
    var that = this;

    if (!entity.initializeVectors) {
      return;
    }

    entity.initializeVectors(this.entities.length);

    this.entities.forEach(
      entity.locatecloseEntities.bind(entity)
    );

    entity.closeCount = entity.closeEntities.length;

    entity.process();
  }

  finalizeElement(entity, index) {
    if (entity.finalize) {
      entity.finalize();
    }

    super.processEntity(entity, index);
  }

  trackFPS(delta) {
    this.frameTimes[this.frames] = delta;
    this.frames = this.frames + 1;

    if (this.frames > 99) {
      this.frames = 0;

      this.average = Math.round(1 / (_.mean(this.frameTimes) / 1000), 2);

      if (this.nextFPSUpdate < 0) {
        this.displayFPS[0].innerText = this.average;
        this.nextFPSUpdate = 1000;
      }
      else {
        this.nextFPSUpdate -= delta;
      }
    }
  }

  process(delta) {
    this.liveTrackFPS(delta);

    for (this.i = this.entities.length - 1; this.i >= 0; this.i--) {
      this.entities[this.i].velocityX = this.entities[this.i].heading.x * this.entities[this.i].speed;
      this.entities[this.i].velocityY = this.entities[this.i].heading.y * this.entities[this.i].speed;
    }

    for (this.i = this.entities.length - 1; this.i >= 0; this.i--) {
      this.processEntity(this.entities[this.i], this.i);
    }

    for (this.i = this.entities.length - 1; this.i >= 0; this.i--) {
      this.finalizeElement(this.entities[this.i], this.i);
    }
  }
}

export default Engine;
