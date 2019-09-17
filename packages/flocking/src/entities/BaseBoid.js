import {BaseEntity, Point, Vector} from '2d-engine';

var tempVector = new Vector(0, 0);
var id = 0;

class BaseBoid extends BaseEntity {
  constructor(options) {
    super(options);

    this.id = ++id;

    this.initializeProperties(options);

    this.heading = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
    this.heading.normalize();

    this.weight = 1;

    this.baseSpeed = this.speed;
    this.oldRadius = this.radius;
    this.oldGroup = this.group;

    this.closeEntities = [];

    this.alignmentVector = new Vector(0, 0);
    this.cohesionVector = new Vector(0, 0);
    this.separationVector = new Vector(0, 0);

    this.groupAlignmentVector = new Vector(0, 0);
    this.groupCohesionVector = new Vector(0, 0);
    this.groupSeparationVector = new Vector(0, 0);
  }

  startingPosition() {
    return new Point(
      Math.floor(Math.random() * this.xScale.domain()[1]),
      Math.floor(Math.random() * this.yScale.domain()[1])
    );
  }

  initializeProperties(options) {
    options = options || {};

    this.range = options.range || this.xScale.domain()[1];
    this.rangeSq = this.range * this.range;

    this.xMax = this.xScale.domain()[1];
    this.yMax = this.yScale.domain()[1];

    this.alignmentWeight = options.alignmentWeight;
    this.groupAlignmentWeight = options.groupAlignmentWeight;

    this.cohesionWeight = options.cohesionWeight;
    this.groupCohesionWeight = options.groupCohesionWeight;

    this.separationWeight = options.separationWeight;
    this.groupSeparationWeight = options.groupSeparationWeight;

    if (options.initialize) {
      options.initialize.bind(this)();
    }

    this.renderMethod = options.render;
  }

  initializeVectors(length) {
    if (this.closeEntities.length !== length) {
      this.closeEntities.length = length;
    }

    this.alignmentVector.x = 0;
    this.alignmentVector.y = 0;

    this.groupAlignmentVector.x = 0;
    this.groupAlignmentVector.y = 0;

    this.cohesionVector.x = 0;
    this.cohesionVector.y = 0;

    this.groupCohesionVector.x = 0;
    this.groupCohesionVector.y = 0;

    this.separationVector.x = 0;
    this.separationVector.y = 0;

    this.groupSeparationVector.x = 0;
    this.groupSeparationVector.y = 0;

    this.closeGroup = 0;
    this.nonGroup = 0;
    this.groupTotal = 0;
  }

  closeCheck(other) {
    return other.id !== this.id && tempVector.magnitudeSq() <= this.rangeSq;
  }

  locatecloseEntities(other) {
    tempVector.x = other.pos.x - this.pos.x;
    tempVector.y = other.pos.y - this.pos.y;

    if (this.closeCheck(other)) {
      this.closeEntities[this.groupTotal] = other;

      if (this.group === other.group) {
        this.closeGroup = this.closeGroup + 1;
        this.groupTotal = this.groupTotal + 1;
      } else {
        this.nonGroup = this.nonGroup + 1;
        this.groupTotal = this.groupTotal + 1;
      }
    }
  }

  calculate(other) {
    this.calculateAlignment(other);
    this.calculateCohesion(other);
    this.calculateSeparation(other);
  }

  calculateAlignment(other) {
    if (this.group - other.group) {
      this.groupAlignmentVector.x = other.velocityX + this.groupAlignmentVector.x;
      this.groupAlignmentVector.y = other.velocityY + this.groupAlignmentVector.y;
    } else {
      this.alignmentVector.x = other.velocityX + this.alignmentVector.x;
      this.alignmentVector.y = other.velocityY + this.alignmentVector.y;
    }
  }

  finalizeAlignment(vector, closeEntities) {
    vector.x = vector.x / closeEntities;
    vector.y = vector.y / closeEntities;
  }

  calculateCohesion(other) {
    if (this.group === other.group) {
      this.groupCohesionVector.x = other.pos.x + this.groupCohesionVector.x;
      this.groupCohesionVector.y = other.pos.y + this.groupCohesionVector.y;
    } else {
      this.cohesionVector.x = other.pos.x + this.cohesionVector.x;
      this.cohesionVector.y = other.pos.y + this.cohesionVector.y;
    }
  }

  finalizeCohesion(vector, closeEntities) {
    vector.x = (vector.x / closeEntities) - this.pos.x;
    vector.y = (vector.y / closeEntities) - this.pos.y;
  }

  calculateSeparation(other) {
    tempVector.x = other.pos.x - this.pos.x;
    tempVector.y = other.pos.y - this.pos.y;

    this.tempMagnitude = tempVector.magnitude();

    if (this.tempMagnitude === 0) {
      return;
    }

    tempVector.x *= -1 / this.tempMagnitude;
    tempVector.y *= -1 / this.tempMagnitude;

    if (this.group === other.group) {
      this.groupSeparationVector.x = tempVector.x + this.groupSeparationVector.x;
      this.groupSeparationVector.y = tempVector.y + this.groupSeparationVector.y;
    } else {
      this.separationVector.x = tempVector.x + this.separationVector.x;
      this.separationVector.y = tempVector.y + this.separationVector.y;
    }
  }

  finalizeSeparation(vector, closeEntities) {

  }

  process() {
    var i = 0;
    for (i; i < this.groupTotal; i++) {
      this.calculate(this.closeEntities[i], i);
    }

    if (this.closeGroup !== 0) {
      this.finalizeAlignment(this.groupAlignmentVector, this.closeGroup);
      this.finalizeCohesion(this.groupCohesionVector, this.closeGroup);
      this.finalizeSeparation(this.groupSeparationVector, this.closeGroup);
    }

    if (this.nonGroup !== 0) {
      this.finalizeAlignment(this.alignmentVector, this.nonGroup);
      this.finalizeCohesion(this.cohesionVector, this.nonGroup);
      this.finalizeSeparation(this.separationVector, this.nonGroup);
    }
  }

  finalize() {
    if (this.nonGroup !== 0) {
      this.alignmentVector.normalize();
      this.cohesionVector.normalize();
      this.separationVector.normalize();

      this.heading.scalePlusEquals(this.alignmentWeight, this.alignmentVector);
      this.heading.scalePlusEquals(this.cohesionWeight, this.cohesionVector);
      this.heading.scalePlusEquals(this.separationWeight, this.separationVector);
    }

    if (this.closeGroup !== 0) {
      this.groupAlignmentVector.normalize();
      this.groupCohesionVector.normalize();
      this.groupSeparationVector.normalize();

      this.heading.scalePlusEquals(this.groupAlignmentWeight, this.groupAlignmentVector);
      this.heading.scalePlusEquals(this.groupCohesionWeight, this.groupCohesionVector);
      this.heading.scalePlusEquals(this.groupSeparationWeight, this.groupSeparationVector);
    }

    this.heading.normalize();
  }

  updatePos() {
    this.pos.x = (this.pos.x + this.xMax) % this.xMax
    this.pos.y = (this.pos.y + this.yMax) % this.yMax;
  }

  update(delta) {
    this.pos.scalePlusEquals(this.speed * delta, this.heading);

    this.updatePos();

    this.element.translation.set(
      this.xScale(this.pos.x),
      this.yScale(this.pos.y)
    );
  }

  renderRange(canvas) {
    if (this.element) {
      if (!this.rangeElement) {
        this.rangeElement = canvas.makeCircle(0, 0, this.xScale(this.range))

        this.rangeElement.addTo(this.element);
      };

      this.rangeElement.radius = this.xScale(this.range);
      this.rangeElement.noStroke();
      this.rangeElement.fill = "rgba(255, 200, 200, 0.1)";

      this.oldRange = this.range;
      this.oldRangeVisible = this.rangeVisible = true;
    }
  }

  renderHeading(canvas) {
    // if (this.element) {
    //   this.headingElement = this.element.append('path');
    //
    //   this.headingElement
    //     .attr('fill', this.headingFill || '#000000');
    //
    //     this.oldHeading = this.heading;
    //     this.oldHeadingVisible = this.headingVisible = true;
    // }
  }

  updateStyles() {
    if (this.renderMethod) {
      this.renderMethod();
    }

    if (this.rangeElement && this.oldRange !== this.range) {
      this.rangeElement.radius = this.xScale(this.range);
    }

    this.boidElement.radius = this.xScale(this.radius);
    this.boidElement.fill = this.fill || '#000000';
    this.boidElement.noStroke();
  }

  destroy() {
    this.element.remove();
    this.element = undefined;
    this.boidElement = undefined;
    this.headingElement = undefined;
    this.rangeElement = undefined;
  }

  render(canvas) {
    if (!this.element) {
      this.element = canvas.makeGroup();
    }

    if (!this.boidElement) {
      this.boidElement = canvas.makeCircle(0, 0, this.xScale(this.radius));
      this.boidElement.addTo(this.element);
    }

    if (!this.rangeElement && this.rangeVisible) {
      this.renderRange(canvas);
    }

    if (!this.headingElement && this.headingVisible) {
      this.renderHeading(canvas);
    }

    this.updateStyles();
  }
}

export default BaseBoid;
