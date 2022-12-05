import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares";
import bookingsService from "@/services/bookings-service";
import httpStatus from "http-status";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  try {
    const booking = await bookingsService.getBooking(Number(userId));
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;

  if (roomId < 1) {
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }

  try {
    const booking = await bookingsService.postBooking(userId, roomId);

    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === "ForbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
  }
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;
  const { bookingId } = req.params;

  if (!bookingId || roomId < 1)
    try {
      const booking = await bookingsService.updateBooking(userId, roomId, bookingId);
      return res.status(httpStatus.OK).send(booking);
    } catch (error) {
      if (error.name === "NotFoundError") {
        return res.sendStatus(httpStatus.NOT_FOUND);
      }
      if (error.name === "ForbiddenError") {
        return res.sendStatus(httpStatus.FORBIDDEN);
      }
    }
}
