import bookingRepository from "@/repositories/booking-repository";
import { notFoundError } from "@/errors";

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
  const booking = await bookingRepository.getBooking(userId);

  const bookingData = {
    id: booking.id,
    userId,
    Room: booking.Room,
    roomId,
  };

  const creation = await bookingRepository.postBooking(bookingData);
  if (!creation) {
    throw notFoundError();
  }

  return creation;
}
const bookingsService = {
  getBooking,
  postBooking,
};

export default bookingsService;
