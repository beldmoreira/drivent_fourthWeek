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

const bookingRepository = {
  getBooking,
};

export default bookingRepository;
