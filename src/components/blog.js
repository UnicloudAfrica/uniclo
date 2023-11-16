import arrowdown from './assets/Arrow_Down_Right_LG.svg';

const BlogHero = () => {

    const data = [
        { topic: "Finance Services", content: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing......." },
        { topic: "Public Sector", content: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing......." },
        { topic: "ICT", content: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing......." },
        { topic: "Education", content: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing......." },
    ];

    return ( 
        <div className=" px-4 md:px-8 lg:px-16 bg-[#f5f5f5] my-[5em] font-Outfit w-full flex flex-col justify-center items-center">
            <p className=" mt-16 font-medium text-2xl md:text-[40px] md:leading-[50px] text-center">Our Blog Section</p>
            <p className=" text-center font-normal text-base md:text-xl md:px-[12%]">Whether you want to learn about Improving your business, or getting started on Unicloud Africa, we have the educational resources for you.</p>
            <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[32px] lg:gap-[20px] w-full mt-8">
            {data.map((item, index) => (
                <div key={index} className="w-full ">             
                    <div className=" w-full h-[290px] bg-[#fff] rounded-[15px]"></div>
                    <p className=" mt-6 text-lg font-medium">{item.topic}</p>
                    <p className=" mt-3 text-[#12121299] text-sm">{item.content}</p>
                    <button className=' flex space-x-3 mt-6 items-center'>
                        <p className=' gradient-text text-base'>Read More</p>
                        <img src={ arrowdown } className=' w-4 h-4' alt="" />
                    </button>
                </div>
            ))}
            </div>
            <button className=' bg-black text-sm md:text-xl mb-[64px] font-normal text-white mt-16 py-3 px-9 rounded-[30px] text-center'>View more</button>
        </div>
     );
}
 
export default BlogHero;