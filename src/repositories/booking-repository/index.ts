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

async function postBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId,
    },
  });
}

async function findRooms(roomId: number) {
  return prisma.room.findFirst({
    where: { id: roomId },
    include: {
      Booking: true,
    },
  });
}

async function updateBooking(bookingId: string, roomId: number) {
  return prisma.booking.update({
    where: {
      id: Number(bookingId),
    },
    data: {
      roomId: roomId,
    },
  });
}

async function findBookingById(bookingId: string) {
  return await prisma.booking.findFirst({
    where: {
      id: Number(bookingId),
    },
    include: {
      Room: true,
    },
  });
}

const bookingRepository = {
  getBooking,
  postBooking,
  findRooms,
  updateBooking,
  findBookingById,
};

export default bookingRepository;
