export default function BookingFlow() {
  const { step } = useBooking();

  return (
    <div className="container">
      {step === 1 && <BarberStep />}
      {step === 2 && <DateStep />}
      {step === 3 && <ServicesStep />}
      {step === 4 && <ReviewStep />}

      //passar telefone 

      //5 etapa
    </div>
  );
}