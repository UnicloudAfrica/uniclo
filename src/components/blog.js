import arrowdown from './assets/Arrow_Down_Right_LG.svg';
import {useContext} from 'react'
import { PageContext, BlogContext } from '../contexts/contextprovider';
import { Link } from 'react-router-dom';

const BlogHero = () => {

    const [blogArray] = useContext(BlogContext);

    return ( 
        <div className=" px-4 md:px-8 lg:px-16 bg-[#f5f5f5] my-[5em] font-Outfit w-full flex flex-col justify-center items-center">
            <p className=" mt-16 font-medium text-2xl md:text-[40px] md:leading-[50px] text-center">Our Blog Section</p>
            <p className=" text-center font-normal text-base md:text-xl md:px-[12%]">Whether you want to learn about Improving your business, or getting started on Unicloud Africa, we have the educational resources for you.</p>
            <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[32px] lg:gap-[20px] w-full mt-8">
            {blogArray.map((item, index) => (
                <div key={index} className="w-full ">             
                    <div className=" w-full h-[290px] bg-[#fff] rounded-[15px]" style={{ backgroundImage: `url(${item.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    <p className=" mt-6 text-lg font-medium md:h-[4.5em]">{item.title}</p>
                    <p className=" mt-3 text-[#12121299] text-sm">{item.content.substring(0,100) + '...'}</p>
                    <Link to={`/blogs/${item.id}`}><button className=' flex mt-6 items-center'>
                        <p className=' gradient-text text-base'>Read More</p>
                    </button></Link>
                </div>
            ))}
            </div>
            <Link to='/blog'><button className=' bg-black text-sm md:text-xl mb-[64px] font-normal text-white mt-16 py-3 px-9 rounded-[30px] text-center'>View more</button></Link>
        </div>
     );
}
 
export default BlogHero;