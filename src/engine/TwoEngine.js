import * as d3 from 'd3';
import _ from 'lodash';
import Two from 'two.js'

import Engine from './Engine';

/**
 * An engine is the workhorse for the 2d game engine
 */
class TwoEngine extends Engine {
  initializeCanvas(canvasClass, pixelX, pixelY, options) {
    var parent = document.querySelector(canvasClass);

    this.canvas = new Two({
      width: pixelX,
      height: pixelY,
      type: Two.Types.svg
    });

    this.canvas.appendTo(parent);

    var context = this;
    this.canvas.bind('update', function() {
      context.tick();
    });
  }

  addEntity(entity) {
    super.addEntity(entity);

    entity.render(this.canvas);
  }

  /**
   * Preprocess the entity, this primarily makes sure the selection is up to
   * date in cases where the entity has been removed and replaced with a new one
   */
  preProcessEntity(entity, index) {
    this.processEntity(entity, index);
  }

  /**
   * Process gets called every tick
   */
  process(delta) {
    var context = this;

    super.process(delta);

    _.each(this.entities, function(entity, index) {
      context.preProcessEntity(entity, index);
    });
  }

  /**
   * Run an iteration of the engine
   */
  tick() {
    var delta = super.tick();

    this.process(delta);
  }

  /**
   * Start the engine
   */
  start() {
    super.start();
    this.canvas.play();
  }

  /**
   * Stop the engine
   */
  stop() {

  }
}

export default TwoEngine;
