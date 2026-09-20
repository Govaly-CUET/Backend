const Shipment = require('../models/shipmentModel');

/*
 * Orders no longer store a status. An order's status is its shipment's
 * status, so anything that has to filter or count orders by status adds
 * these aggregation stages first and then uses the `orderStatus` field.
 *
 *   shipment pending    -> pending
 *   shipment delivered  -> delivered
 *   shipment cancelled  -> canceled
 *   anything else       -> in_progress
 *
 * An order with no shipment document yet is pending.
 */
const shipmentStatus = { $ifNull: [{ $arrayElemAt: ['$_shipment.status', 0] }, 'pending'] };

const ORDER_STATUS_STAGES = [
  {
    $lookup: {
      from: Shipment.collection.name,
      localField: '_id',
      foreignField: 'order',
      as: '_shipment',
    },
  },
  {
    $addFields: {
      orderStatus: {
        $switch: {
          branches: [
            { case: { $eq: [shipmentStatus, 'pending'] }, then: 'pending' },
            { case: { $eq: [shipmentStatus, 'delivered'] }, then: 'delivered' },
            { case: { $eq: [shipmentStatus, 'cancelled'] }, then: 'canceled' },
          ],
          default: 'in_progress',
        },
      },
    },
  },
  { $project: { _shipment: 0 } },
];

module.exports = { ORDER_STATUS_STAGES };
