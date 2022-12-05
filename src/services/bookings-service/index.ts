import bookingRepository from "@/repositories/booking-repository";
import { conflictError, notFoundError, unauthorizedError, forbiddenError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { Booking } from "@prisma/client";

async function getBooking(userId: number) {
  const booking = await bookingRepository.getBooking(userId);
  if (!booking) {
    throw notFoundError();
  }
  return {
    id: booking.id,
    Room: booking.Room,
  };
}

async function postBooking(roomId: number, userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw forbiddenError();
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.includesHotel || ticket.TicketType.isRemote) {
    throw forbiddenError();
  }

  const room = await bookingRepository.findRooms(roomId);
  if (!room) {
    notFoundError();
  }
  if (room.Booking.length >= room.capacity) {
    throw forbiddenError();
  }

  const bookingExists = await bookingRepository.getBooking(userId);
  if (bookingExists) {
    throw forbiddenError();
  }
  const booking: Booking = await bookingRepository.postBooking(userId, roomId);
  return { id: booking.id };
}

async function updateBooking(userId: number, roomId: number, bookingId: string) {
  const checkEnrollmentId = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!checkEnrollmentId) {
    throw unauthorizedError();
  }
  const ticket = await ticketRepository.findTicketByEnrollmentId(checkEnrollmentId.id);
  if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote) {
    throw unauthorizedError();
  }

  const room = await bookingRepository.findRooms(roomId);
  if (!room) {
    notFoundError();
  }

  if (room.Booking.length >= room.capacity) {
    throw unauthorizedError();
  }

  const booking = await bookingRepository.getBooking(userId);
  if (!booking || booking.id !== userId) {
    throw unauthorizedError();
  }

  const updateBooking = await bookingRepository.updateBooking(bookingId, roomId);
  return { id: updateBooking.id };
}

const bookingsService = {
  getBooking,
  postBooking,
  updateBooking,
};

export default bookingsService;
