import { prisma } from "@/config";
import { Booking } from "@prisma/client";

async function getBooking(userId: number) {
  return prisma.booking.findFirst({
    where: { userId },
    include: {
      Room: true,
    },
  });
}

async function postBooking(booking: CreateBookingParams) {
  return prisma.booking.create({
    data: {
      ...booking,
    },
  });
}

export type CreateBookingParams = Omit<Booking, "id" | "createdAt" | "updatedAt">;

const bookingRepository = {
  getBooking,
  postBooking,
};

export default bookingRepository;
