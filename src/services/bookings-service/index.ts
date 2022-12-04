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

const bookingsService = {
  getBooking,
};

export default bookingsService;
